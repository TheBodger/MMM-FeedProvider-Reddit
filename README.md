# MMM-FeedProvider-Reddit Module

This magic mirror module is a MMM-FeedProvider module that is part of the the MMM-Feedxxx interrelated modules.

For an overview of these modules see the README.md in https://github.com/TheBodger/MMM-FeedDisplay.

the -Reddit module will monitor and format any Reddit feeds it is configured to get. It will extract text and the first Image that is embbeded within a feed item.

The included redfetcher.js was amended from https://github.com/sahilm/reddit.js. The original is a browser only script and was amended to work within a nodejs environment with a couple of bug fixes.

### Example
![Example of MMM-FeedProvider-Reddit output](images/screenshot.png?raw=true "Example screenshot")

### Dependencies

Before installing this module, use https://github.com/TheBodger/MMM-FeedUtilities to setup the MMM-Feed... dependencies and  install all modules 

The following node modules are required: 

```
moment
xmlhttprequest (Required by redfetcher.js)
```

## Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Clone the module:<br />`git clone https://github.com/TheBodger/MMM-FeedProvider-Reddit`

## Using the module

### MagicMirror² Configuration

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
		{
			module: "MMM-FeedProvider-Reddit",
			config: {
				id: "MMFP-reddit",
				consumerids: ["MMFD1"],
				datarefreshinterval: 11000,
				feeds: [
					{
						feedname: 'Nature',
						feedtitle: 'Nature',
						reddit: 'nature',
						oldestage: 'all',
						type: 'top',

					},
					{
						feedname: 'Funny',
						feedtitle: 'Funny',
						reddit: 'funny',
						oldestage: 'all',
						type: 'top',

					},
				],
			}
		},

```

### Configuration Options

| Option                  | Details
|------------------------ |--------------
| `text`                | *Optional* - <br><br> **Possible values:** Any string.<br> **Default value:** The Module name
| `consumerids`            | *Required* - a list of 1 or more consumer modules this module will provide for.<br><br> **Possible values:** An array of strings exactly matching the ID of one or more MMM-FeedDisplay modules <br> **Default value:** none
| `id`         | *Required* - The unique ID of this provider module<br><br> **Possible values:** any unique string<br> **Default value:** none
| `datarefreshinterval`            | *Optional* - milliseconds to pause before checking for new data in the feeds.<br><br> **Possible values:** a number in milliseconds <br> **Default value:** `60000` 
| `limit`            |*optional* -  limits the number of posts to return from any feed<br><br> **Possible values:** Any number. <br> **Default value:** `25` - module default
| `type`            |*optional* -  type of action to apply against any feed<br><br> **Possible values:** `search`, `searchsub`, `top`, `hot`, `controversial` or `random`. <br> **Default value:** `top` - module default
| `adultonly`            |*optional* -  provide posts that are designated over-18 <br><br> **Possible values:** `true`,`false`. <br> **Default value:** `true`
| `nolinks`            |*optional* -  ignore posts that are links to other psots or sites<br><br> **Possible values:** `true`,`false`. <br> **Default value:** `true`
| `feeds`        | *required* - See below for the feed format
| `waitforqueuetime`            |*Ignore* -  Queue delay between ending one queue item and starting the next <br><br> **Possible values:** a number in milliseconds. <br> **Default value:** `10`
| `Feed Format`            |
| `feedname`            |*Required* -  Name of the feed for reference purposes<br><br> **Possible values:** Any unique string. <br> **Default value:** none
| `feedtitle`            |*Required* -  Title of the feed for reference purposes.<br><br> **Possible values:** Any unique string. <br> **Default value:** none
| `reddit`            |*Required* -  Search string or subreddit name.<br><br> **Possible values:** any valid string search or subreddit strings.<br> **Default value:** none
| `oldestage`            |*Required* -  Filter out any articles older than this "age" (As defined by the pubdate in the Reddit feed). <br><br> **Possible values:** 'today' or a number of minutes or a valid date(See [Moment.js formats](http://momentjs.com/docs/#/parsing/string-format/). <br> **Default value:** none
| `limit`            |*optional* -  limits the number of posts to return. Overides the module default<br><br> **Possible values:** Any number. <br> **Default value:** module default
| `type`            |*optional* -  type of reddit action to apply. Overides the module default<br><br> **Possible values:** see module default. <br> **Default value:** module default

### Additional Notes

Not all of the potential search capabilities have been implemented yet.

This is a WIP; changes are being made all the time to improve the compatability across the modules. Please refresh this and the MMM-feedUtilities modules with a `git pull` in the relevant modeules folders.# MMM-FeedProvider-Reddit