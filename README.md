# MMM-FeedProvider-Reddit
A Feed provider for Reddit

reddit.js

  // Fetch 5 subreddits related to gardening
  reddit.searchSubreddits("gardening").limit(5).fetch();

  Fetch the top posts on Reddit or on a subreddit As usual all filters are supported… The t filter allows filtering by top posts of the day, week, month, year or all-time.

  // Fetch the 25 most controversial posts from this month
  reddit.controversial().t('month').limit(25).fetch(function(res) {
    console.log(res);
  });


  
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


  reddit.subredditsByTopic("programming").fetch();

    // Fetch the top 5 funniest posts of all time from /r/funny
  reddit.top('funny').t('all').limit(5).fetch(function(res) {
    console.log(res);
  });

    // Fetch 5 subreddits related to gardening
  reddit.searchSubreddits("gardening").limit(5).fetch();
