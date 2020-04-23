# MMM-FeedProvider-Reddit
A Feed provider for Reddit

example config

```
		{
			module: "MMM-FeedProvider-Reddit",
			config: {
				text: "Help me!!",
				id: "MMFP1",
				consumerids: ["MMFD1","MMFD2"],
				datarefreshinterval: 11000,
				feeds: [
					{
						feedname: 'Funny',
						feedtitle: 'Funny',
						reddit: 'nature',
						oldestage: 'all',
						type: 'top',
					},
				],
			}
		},

```

  // Fetch 5 subreddits related to gardening
  reddit.searchSubreddits("gardening").limit(5).fetch();

  Fetch the top posts on Reddit or on a subreddit As usual all filters are supported… The t filter allows filtering by top posts of the day, week, month, year or all-time.

  // Fetch the 25 most controversial posts from this month
  reddit.controversial().t('month').limit(25).fetch(function(res) {
    console.log(res);
  });



this provider supports the following types of calls to the redit fetcher, taken from the browser only reddit.js
  
    Search

Search everything. All filters including syntax and t are supported.

  reddit.search("programming").t('month').limit(1).sort("hot").fetch();

    Search subreddits

Search subreddits by title and description. Filter away.

  // Fetch 5 subreddits related to gardening
  reddit.searchSubreddits("gardening").limit(5).fetch();

    Random

The Serendipity button.

  // Fetch random articles from /r/funny
  reddit.random("funny").fetch(function(res) {
    console.log(res);
  });


