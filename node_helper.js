//this loads reddit posts depending on its config when called to from the main module
//to minimise activity, it will track what data has been already sent back to the module
//and only send the delta each time

//this is done by making a note of the last published data of tweets sent to the module tracked at the tweet seach key level
//and ignoring anything older than that

//as some tweets wont have a published date, they will be allocated a pseudo published date of the latest published date in the current processed feeds

//if the module calls a RESET, then the date tracking is reset and all data will be sent 

//this is copied from other MMM-FeedPRovider modules and uses a common terminology of feed. this simply represent the incoming
//information and doesnt represent what the actual data is
//only the core changes will appear differently and reference the actual purpose of the module.

//nodehelper stuff:
//this.name String The name of the module

var NodeHelper = require("node_helper");

var redfetcher = require('./redfetcher'); // for fetching reddits
var reddit = new redfetcher.reddit(); // for fetching reddits

var moment = require('moment'); // for fetching the feed

//pseudo structures for commonality across all modules
//obtained from a helper file of modules

var LOG = require('../MMM-FeedUtilities/LOG');
var RSS = require('../MMM-FeedUtilities/RSS');
var QUEUE = require('../MMM-FeedUtilities/queueidea');
var UTILITIES = require('../MMM-FeedUtilities/utilities');

// structures

// local variables, held at provider level as this is a common module
//these are largely for the authors reference and are not actually used in thsi code

var providerstorage = {};

var trackingfeeddates = []; //an array of last date of feed recevied, one for each feed in the feeds index, build from the config
var aFeed = { lastFeedDate: '', feedURL: '' };

var payloadformodule = []; //we send back an array of identified stuff
var payloadstuffitem = { stuffID: '', stuff: '' }

var latestfeedpublisheddate = new Date(0) // set the date so no feeds are filtered, it is stored in providerstorage

module.exports = NodeHelper.create({

	start: function () {
		this.debug = true;
		console.log(this.name + ' node_helper is started!');
		this.logger = {};
		this.logger[null] = LOG.createLogger("MMM-FeedProvider-Instagram-node_helper" + ".log", this.name);
		this.queue = new QUEUE.queue("single", false);
		this.maxfeeddate = new Date(0); //used for date checking of posts
	},

	stop: function () {
		console.log("Shutting down node_helper");
	},

	setconfig: function (moduleinstance, config) {

		if (this.debug) { this.logger[moduleinstance].info("In setconfig: " + moduleinstance + " " + config); }

		//store a local copy so we dont have keep moving it about

		providerstorage[moduleinstance] = { config: config, trackingfeeddates: [] };

		var self = this;

		//process the feed details into the local feed tracker

		providerstorage[moduleinstance].config.feeds.forEach(function (configfeed) {

			var feed = {
				sourcetitle: '',
				lastFeedDate: '',
				searchHashTag: '',
				latestfeedpublisheddate: new Date(0),
				configfeed: configfeed,
			};

			//store the actual timestamp to start filtering, this will change as new feeds are pulled to the latest date of those feeds
			//if no date is available on a feed, then the current latest date of a feed published is allocated to it

			if (['day', 'week', 'month', 'year', 'all'].includes(configfeed.oldestage.toLowerCase()))  {
				feed.lastFeedDate = new Date(0); // forces all feeds to be acceptable
			}
			else {
				feed.lastFeedDate = self.calcTimestamp(configfeed.oldestage);
            }

			feed.sourcetitle = configfeed.feedtitle;

			if (configfeed.limit == null) {
				feed.configfeed['limit'] = config.limit; //use the default
			}

			if (configfeed.nolinks == null) {
				feed.configfeed['nolinks'] = config.nolinks;//use the default
			}

			if (configfeed.type == null) {
				feed.configfeed['type'] = config.type;//use the default
			}

			if (configfeed.adultonly == null) {
				feed.configfeed['adultonly'] = config.adultonly;//use the default
			}

			providerstorage[moduleinstance].trackingfeeddates.push(feed);

		});

	},

	calcTimestamp: function (age) {

		//calculate the actual timestamp to use for filtering feeds, 
		//options are timestamp format, today for midnight + 0.0001 seconds today, or age in minutes
		//determine the format of the data in age

		console.log(age);

		var filterDate = new Date();

		if (typeof (age) == 'number') {

			filterDate = new Date(filterDate.getTime() - (age * 60 * 1000));

		}
		else { //age is hopefully a string ha ha

			if (age.toLowerCase() == 'today') {
				filterDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate(), 0, 0, 0, 0)
			}

			else { //we assume the user entered a correct date - we can try some basic validation

				if (moment(age, "YYYY-MM-DD HH:mm:ss", true).isValid()) {
					filterDate = new Date(age);
				}
				else {

					console.log(this.name + " Invalid date provided for filter age of feeds:" + age.toString());
				}

			}
		}

		return filterDate;

	},

	getconfig: function () { return config; },

	reset: function (moduleinstance) {

		//clear the date we have been using to determine the latest data pulled for each feed

		//console.log(providerstorage[id].trackingfeeddates);

		providerstorage[moduleinstance].trackingfeeddates.forEach(function (feed) {

			//console.log(feed);

			feed['latestfeedpublisheddate'] = new Date(0);

			//console.log(feed);

		});

		//console.log(providerstorage[moduleinstance].trackingfeeddates);

	},

	socketNotificationReceived: function (notification, payload) {

		var self = this;

		if (this.logger[payload.moduleinstance] == null) {

			this.logger[payload.moduleinstance] = LOG.createLogger("logfile_" + payload.moduleinstance + ".log", payload.moduleinstance);

		};

		if (this.debug) {
			this.logger[payload.moduleinstance].info(this.name + " NODE HELPER notification: " + notification + " - Payload: ");
			this.logger[payload.moduleinstance].info(JSON.stringify(payload));
		}

		//we can receive these messages:
		//
		//RESET: clear any date processing or other so that all available stuff is returned to the module
		//CONFIG: we get our copy of the config to look after
		//UPDATE: request for any MORE stuff that we have not already sent
		//

		switch (notification) {
			case "CONFIG":
				this.setconfig(payload.moduleinstance, payload.config);
				break;
			case "RESET":
				this.reset(payload);
				break;
			case "UPDATE":
				//because we can get some of these in a browser refresh scenario, we check for the
				//local storage before accepting the request

				if (providerstorage[payload.moduleinstance] == null) { break; } //need to sort this out later !!
				self.processposts(payload.moduleinstance, payload.providerid);
				break;
			case "STATUS":
				this.showstatus(payload.moduleinstance);
				break;
		}

	},

	showstatus: function (moduleinstance) {

		console.log('============================ start of status ========================================');

		console.log('config for provider: ' + moduleinstance);

		console.log(providerstorage[moduleinstance].config);

		console.log('feeds for provider: ' + moduleinstance);

		console.log(providerstorage[moduleinstance].trackingfeeddates);

		console.log('============================= end of status =========================================');

	},

	processposts: function (moduleinstance, providerid) {

		var self = this;
		var feedidx = -1;

		if (this.debug) { this.logger[moduleinstance].info("In processfeeds: " + moduleinstance + " " + providerid); }

		providerstorage[moduleinstance].trackingfeeddates.forEach(function (feed) {

			if (self.debug) {
				self.logger[moduleinstance].info("In process feed: " + JSON.stringify(feed));
				self.logger[moduleinstance].info("In process feed: " + moduleinstance);
				self.logger[moduleinstance].info("In process feed: " + providerid);
				self.logger[moduleinstance].info("In process feed: " + feedidx);
				self.logger[moduleinstance].info("building queue " + self.queue.queue.length);
			}

			//we have to pass the providerid as we are going async now

			self.queue.addtoqueue(function () { self.fetchfeed(feed, moduleinstance, providerid, ++feedidx); });

		});

		this.queue.startqueue(providerstorage[moduleinstance].config.waitforqueuetime);

	},

	sendNotificationToMasterModule: function (stuff, stuff2) {
		this.sendSocketNotification(stuff, stuff2);
	},

	done: function (err) {

		if (err) {

			console.log(err, err.stack);

		}

	},

	send: function (moduleinstance, providerid, source, feeds) {

		var payloadforprovider = { providerid: providerid, source: source, payloadformodule: feeds.items }

		if (this.debug) {
			this.logger[moduleinstance].info("In send, source, feeds // sending items this time: " + feeds.items.length );
			this.logger[moduleinstance].info(JSON.stringify(source));
			this.logger[moduleinstance].info(JSON.stringify(feeds));
		}

		if (feeds.items.length > 0) {
			this.sendNotificationToMasterModule("UPDATED_STUFF_" + moduleinstance, payloadforprovider);
		}

		this.queue.processended();

	},

	fetchfeed: function (feed, moduleinstance, providerid, feedidx) {

		// this to self
		var self = this;

		if (this.debug) {
			this.logger[moduleinstance].info("In fetch feed: " + JSON.stringify(feed));
			this.logger[moduleinstance].info("In fetch feed: " + moduleinstance);
			this.logger[moduleinstance].info("In fetch feed: " + providerid);
			this.logger[moduleinstance].info("In fetch feed: " + feedidx);
		}

		this.maxfeeddate = new Date(0);

		var rssitems = new RSS.RSSitems();

		var sourcetitle = feed.sourcetitle;
		// we use redfetcher module to capture the data for us
		// start of core reddit loop
		// call reddit client based 

		//build the query based on the feed details:
		
		switch (feed.configfeed.type.toLowerCase()) {
			case 'top':

				reddit.top(feed.configfeed.reddit).t(feed.configfeed.oldestage).limit(feed.configfeed.limit).fetch(function (res) {
					self.parseRedditPosts(providerstorage[moduleinstance].config, res, feed, moduleinstance, rssitems, feedidx); 
				});

				break;

			case 'hot':

				reddit.hot(feed.configfeed.reddit).limit(feed.configfeed.limit).fetch(function (res) {
					self.parseRedditPosts(providerstorage[moduleinstance].config, res, feed, moduleinstance, rssitems, feedidx);
				});

				break;

			case 'search':

				reddit.search(feed.configfeed.reddit).t(feed.configfeed.oldestage).limit(feed.configfeed.limit).fetch(function (res) {
					self.parseRedditPosts(providerstorage[moduleinstance].config, res, feed, moduleinstance, rssitems, feedidx);
				}

				);
				break;

			case 'searchsub':

				reddit.searchSubreddits(feed.configfeed.reddit).t(feed.configfeed.oldestage).limit(feed.configfeed.limit).fetch(function (res) {
					self.parseRedditPosts(providerstorage[moduleinstance].config, res, feed, moduleinstance, rssitems, feedidx); 
					}

				);
				break;

			case 'controversial':

				reddit.controversial(feed.configfeed.reddit).t(feed.configfeed.oldestage).limit(feed.configfeed.limit).fetch(function (res) {
					self.parseRedditPosts(providerstorage[moduleinstance].config, res, feed, moduleinstance, rssitems, feedidx);
				}

				);
				break;

			case 'random':

				//because random only returns 1 item (assuming that the subredit is defined in some way)
				//we call this multiple times
				//we define the rssitems here to stop duplication occuring, though being random it may well still duplicate

				var itercount = 1;

				if (feed.configfeed.reddit != null) {
					itercount = feed.configfeed.limit;
				}

				for (var iter = 0; iter < itercount; iter++) {

					reddit.random(feed.configfeed.reddit).fetch(function (res) {
						self.parseRedditPosts(providerstorage[moduleinstance].config, res, feed, moduleinstance, new RSS.RSSitems(), feedidx);
					}

					);
				}
				
				break;


		}

	},

	parseRedditPosts: function (theconfig, items, feed, moduleinstance, rssitems, feedidx) {

		var self = this;

		if (self.debug) { self.logger[moduleinstance].info("parse "); }

		if (items.HTTPStatus != null) { //error occured, just ignore this one and keep going
			console.log(this.name, items.HTTPStatus, items.responseHeaders)
			return;
        }

		if (Array.isArray(items)) { items = items[0];}

		for (var tIndex = 0; tIndex < items.data.children.length; tIndex++) {

			//ignore anything over 18

			var rssarticle = new RSS.RSSitem();
			var post = {};

			var ignorepost = false;

			var media = items.data.children[tIndex].data;

			if (media.over_18 && !feed.configfeed.adultonly) { ignorepost = true;}

			if (media.post_hint == 'link' && feed.configfeed.nolinks) { ignorepost = true;}

			if (!ignorepost) {

				post['image'] = {}

				//|| media.post_hint != 'image' 
				//could check for preseence of preview images, but that isnt always true either

				post['image']['url'] = rssarticle.isImage(media.url) ? media.url : null;

				post['title'] = media.title;

				post['pubdate'] = new Date(media.created_utc * 1000);

				//process the caption into something like a description and categories

				post['categories'] = [];

				post['source'] = media.author;

				//end of converting the instagram item into a post format for standard processing

				if (this.debug) { self.logger[moduleinstance].info("feedparser post read: " + JSON.stringify(post.title)); }

				//ignore any feed older than feed.lastFeedDate or older than the last feed sent back to the modules
				//feed without a feed will be given the current latest feed data

				//because the feeds can come in in reverse date order, we only update the latest feed date at the end in send

				if (post.pubdate == null) {
					post.pubdate = new Date(feed.latestfeedpublisheddate.getTime() + 1);
					console.log("Article missing a date - so used: " + feed['latestfeedpublisheddate']);
				}

				//special condition for random - dont check the dates!!
				if(	feed.configfeed.type.toLowerCase() == 'random' ||
					post.pubdate >= feed.lastFeedDate && post.pubdate > feed.latestfeedpublisheddate) {

					rssarticle.id = rssarticle.gethashCode(post.title);
					rssarticle.title = post.title;

					rssarticle.pubdate = post.pubdate;
					self.maxfeeddate = new Date(Math.max(self.maxfeeddate, post.pubdate));

					rssarticle.description = post.description;
					rssarticle.age = rssarticle.getage(new Date(), rssarticle.pubdate); //in microseconds
					rssarticle.categories = post.categories;
					rssarticle.source = post.source;

					rssarticle.imageURL = post.image.url;

					if (self.debug) { self.logger[moduleinstance].info("article " + JSON.stringify(rssarticle)); }

					rssitems.items.push(rssarticle);

				}
				else {
					if (self.debug) { self.logger[moduleinstance].info("Already sent this item or it is too old - just like m. " + post.pubdate + " " + feed.lastFeedDate); }
				}
			}

		} //end of processing this particular batch of tweets

		if (new Date(0) < self.maxfeeddate) {
			providerstorage[moduleinstance].trackingfeeddates[feedidx]['latestfeedpublisheddate'] = self.maxfeeddate;
		}

		//this is needed for the processing in the display manager (alternate)
		var rsssource = new RSS.RSSsource();
		rsssource.sourceiconclass = 'fa fa-reddit redditred';

		rsssource.sourcetitle = feed.configfeed.feedtitle;
		rsssource.title = feed.configfeed.feedtitle;

		self.send(moduleinstance, theconfig.id, rsssource, rssitems);

		self.done();

	},

});
