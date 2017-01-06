# Liquim Mobile Voter App

[![node](http://img.shields.io/badge/node-6.3.1-brightgreen.svg)]()

Liquium is an Open Source polling framework based in Smart Contracts running in the Ethereum network which allows to perform liquid democracy.

We've built a template for organizations which want to integrate a public, fair and transparent polling system, so they can modify it for their own context just forking this and its brother repositories.

You can know more about Liquium in our [wiki](https://github.com/AtrauraBlockchain/liquium-mobile/wiki/About-Liquium).

# Ionic App for the voters

This will be the app used by the voters to vote and delegate their vote (if needed). This mobile app is multiplatform, which means that can be built and run in both Android and iOS.

When you deploy your polling system, you need a nice and smooth interface easy to use by everyone, so we've developed this Ionic App for you. This app can create Ethereum accounts and sign Ethereum transactions to send them to our Node.JS Ethereum endpoint server, which will broadcast them to the network, avoiding to have an Ethereum node in every device, but without losing security.

### Features
This app let's the voter do the following things:
- Display polls in a list (active and past).
- Display polls by categories (active and past).
- Vote in a poll.
- Delegate his vote to a delegate in a specific category.
- Undelegate his vote.

### Test and build your own Liquium Voter App

You can find a tutorial about how to [Test and build your own Liquium Voter App](https://github.com/AtrauraBlockchain/liquium-mobile/wiki/Test-and-build-your-own-Liquium-Voter-App) in our [wiki](https://github.com/AtrauraBlockchain/liquium-mobile/wiki/Test-and-build-your-own-Liquium-Voter-App).

### Publishing your app

When you've customized the app to work exactly how your organization wants, you only have to publish the app at the official stores following this [tutorial](https://ionicframework.com/docs/guide/publishing.html).

![banner](https://s30.postimg.org/rd8670hi9/Pasted_image_at_2017_01_03_04_52_PM_1.png)

