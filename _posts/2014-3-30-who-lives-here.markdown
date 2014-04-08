---
layout: post
title:  "Who Lives Here?, and the joy of stupidly simple apps"
date:   2014-3-30 01:28:00
---

I released another app this week. It's called Who Lives Here?, and it's probably the simplest app I've ever written.

First, a brief summary of how it works. Behind a simple UI lies a "FNMFriendClient" which uses the Facebook SDK to perform an FQL query. FQL is a pretty neat technology that lets you make extremely specific requests on the Facebook Graph using SQL-like syntax. In this case I'm using it to retrieve all of your friends, as well as their current city. Facebook is kind enough to give you a lat/lng for this, saving me the trouble (in a way, to my mild annoyance, the whole app is kind of a Facebook commercial). It then simultaneously uses a CLLocationManager to geocode a user-provided location (such as "San Francisco" or "France"), and then filters the friend list that Facebook returns based on whether or not their location coordinates fall within the returned CLLocation (which I dilate a small amount to include, say, Palo Alto when you're searching for San Francisco). It then, you know, shows you the list. Tapping on someone's name lets you view them in the Facebook app (kind of annoying - Facebook won't trust 3rd-party apps with a user's friends' contact info, so you can't pull down their phone numbers or anything, but you can use a poorly-documented URL scheme to open their profile in the Facebook app. See the above comment about the whole app being a Facebook commercial.)

That's it. It doesn't do anything else. I think this is its biggest strength, for a couple of reasons.
- It's immediately understandable. You open it, and are presented with a prompt: "I'm looking for friends in..." with a visible keyboard. No tutorial required. The search functionality is robust enough that almost no matter what you type for your first search, be it a city, state, or country, some friends will come up (assuming you know anyone who lives there). It's a really nice experience, despite the fact that it uses a 100% stock UI.
- It fixes an extraordinarily specific problem in a very direct and memorable way. The problem is "I am traveling to a different city, and I want to know who I know that lives here." I won't use this app again until the next time I'm traveling, but when I am, I'll trigger a very specific memory that I have a tool for this problem. Thus, although the problem space it solves is very small, the likelihood that I'll use it when I encounter that problem is very high.

I'm really interested in this idea. Personally, I'm trying to document small, specifi annoyances in my life that I think can be solved this way, and then write simple apps to solve them. The loose constraint that I'm keeping is that apps should have at most 2 screens. This all but guarantees that when you open an app, you're already on the screen that helps you solve your problem.

I've already got 3 more apps like this in the pipeline. The problems they solve:
- "I want to discreetly show a message to my friend under the table about someone else that we are currently having dinner with."
- "I am walking past an interesting-looking store and I want to remember where it is and what it looks like."
- "I am having trouble picking a place for dinner and want an app to just tell me where to go."

I almost certainly have an app on my phone (Notes, Yelp, etc) already that I could use to solve any of those problems. But with that comes some cognitive load about how to use that tool to solve that particular problem. If I have a tool that's perfectly suited, I'll be more likely to use it.
