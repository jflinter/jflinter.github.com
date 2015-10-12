---
layout: post
title:  "This One Weird Trick Makes Developing iOS Apps Against a Local Server Way Easier"
date:   2015-10-09 00:56:00
---

I want to talk about something that's always annoyed me about the iOS development process, and an elegant way to fix it.

OK. So let's say you're developing an oh-so-fancy app that talks to a server - say, `api.myfancyapp.com`. It can be helpful to run a copy of your API server locally on your Mac, and then point your app to that instead (especially if you're developing features in tandem in your app and on the server). So now instead we want our app to point to, say, `localhost:3000`. To fix this, you can create a custom `Debug` build configuration, and make it so that your app's API client pulls its base URL dynamically from that build configuration. This process is fairly well-covered elsewhere (I like [this blog post][0] - it's old and written in pre-ARC objective-c, but explains everything nicely), so I won't go into too much detail here.

Except, what if you want to test your app on a device? While the iOS simulator is smart enough to understand that `localhost` means "the Mac on which the simulator is running", if your app is running on a device it'll try and connect to itself (and unless you're way cleverer/insaner than I am, you probably don't have a rails server running on your iPhone) and fail. One nice solution to this problem is to use a service like [ngrok][1], which allows you to forward a port from your local machine onto the public-facing internet and then connect to that instead. You could also use the awesome [Charles Proxy][2] to redirect all traffic from your phone through your Mac. Both of these approaches have their drawbacks, though - you need to buy ngrok/Charles, need to remember to start them each time you start debugging, etc. Also, neither approach scales well when you have multiple collaborators on the same app, which I'll address more in a second.

Alternatively, another really clever thing you can do is to connect your Mac and your iOS device to the same WiFi network and then point your iOS device to your Mac's ["Local Network Name"][3] instead. You can see what this value is by opening the "Sharing" pane in System Preferences, or by running `scutil --get LocalHostName` in a terminal and appending `.local` to the result. So, instead of setting your app's API client's base URL to `localhost:3000`, you'd set it to something like `jacks-macbook.local` (that's what my value is, anyway), and it'll work in both the simulator and on a device!

Except, what if you have multiple people working on the same app? You can't just hard-code `jacks-macbook.local` into your app's source code - then it won't work for your colleagues, and they'll change it, and you'll get merge conflicts, and eventually all of you will get frustrated and quit your jobs (ok, hopefully not that last part). Also, this base URL is really just configuration, and shouldn't live in your source code. So instead, we can harness the power of custom Xcode schemes. If you haven't worked with them that much, Xcode schemes are a really nice way of defining a sort of saved, custom "launch environment" - you can specify environment variables and launch arguments to run your app with every time. Importantly, you can also specify custom scripts to run each time you build your app (for more information, there is (of course) a nice [NSHipster article][4] on this. My friend Cameron also goes into some good detail on his [blog][5]).

So, here's the plan: we'll make a new scheme that marks our build as being in a local development environment. We'll then add a build script that, when in that environment, determines your Mac's local network name and embed that value into your app so that it's accessible at runtime. That way, if 2 different developers build the app with our new scheme, each copy of their app will automagically point itself to the appropriate URL.

This next part is a little boring (it just walks you through which buttons to click in Xcode), so if you'd rather watch a gif of it, do so and then skip ahead to the 🐸.

<a href="/assets/letsmanagesomeschemes.gif" target="_blank"><div class='gif-container'><img src="/assets/letsmanagesomeschemes.gif"></div></a>

So to do this, first let's create a new scheme (Product → Scheme → Manage Schemes... in Xcode, then click the "+" in the lower left) and name it `MyFancyApp-LocalDevelopment`. Make sure the "shared" box is checked (this will allow you to check this new scheme into source control, otherwise it'll just live locally on your machine). Then select it and hit "Edit...". Click the arrow next to "Build" on the left, then select "Pre-actions", then the "+" in the lower left, then select "New run script action" (side note: this workflow is really hard to discover).  Then, paste the following script in (make sure you've selected your app's target in "provide build settings from", or this won't work):

```bash
touch "${CONFIGURATION_TEMP_DIR}/LocalDevelopmentOverridesEnabled"
```

Next, do the same thing, this time adding a script to "Post-actions" with the following contents:

```bash
rm "${CONFIGURATION_TEMP_DIR}/LocalDevelopmentOverridesEnabled"
```

🐸

These two scripts simply create a file in the build's intermediates directory (a generally OK place to put things like this) before the build starts and delete it after the build is done. Thus, we can use the presence (or absence) of this file during our build to know if we're running in the `MyFancyApp-LocalDevelopment` scheme.

Next, go to the "Build Phases" tab of your application's settings, click the "+" in the upper left, and add a new "Run Script Build Phase" with the following contents (make sure it's executed at the very end of the "Build Phases" section):

```bash
PLIST_FILE="${TARGET_BUILD_DIR}/${CONTENTS_FOLDER_PATH}/LocalDevelopmentOverrides.plist"
rm -f $PLIST_FILE

if [ -f $"${CONFIGURATION_TEMP_DIR}/LocalDevelopmentOverridesEnabled" ]
then
    LOCAL_NETWORK_NAME="$(scutil --get LocalHostName | tr "[:upper:]" "[:lower:]").local"
    /usr/libexec/PlistBuddy -c "add :localNetworkName string $LOCAL_NETWORK_NAME" $PLIST_FILE
fi
```

This script checks for the presence of the "are we running in the local development scheme" file, and if it's there, it creates a new plist file named `LocalDevelopmentOverrides` and adds your Mac's local network name to it under the `localNetworkName` field (incidentally, it does so with a nice but not-well-known tool called "PlistBuddy", for which you can find a nice explanation [here][6]. This file is created in your target's build directory (i.e. your DerivedData folder), not your project directory, just before your application is copied onto your device (or simulator). It effectively injects a bit of configuration into your app at the last possible second. The nice thing about this approach is that it effectively makes it impossible to leak any sensitive information into your application when you're not running in this LocalDevelopment scheme - you don't even have a file to check into source control!

Finally, we can look for this `LocalDevelopmentOverrides.plist` file in our application at runtime as follows:

```swift
public struct LocalDevelopmentOverrides {

    public static let configuration: [String: String]? = {
        guard let path = NSBundle.mainBundle().pathForResource("LocalDevelopmentOverrides", ofType: "plist") else {
            return nil
        }
        return NSDictionary(contentsOfFile: path) as? [String: String]
    }()

}
```

Then, in your application, you could do something like:

```swift
if let hostNameOverride = LocalDevelopmentOverrides.configuration?["localNetworkName"] {
    myApiClient.baseUrl = "http://\(hostnameOverride):3000"
} else {
    myApiClient.baseUrl = "https://api.myfancyapp.com"
}
```

Neat! Again, the nice thing about this setup is that you can kind of forget about it: all you have to do to enter "Local Development" mode is build your app in the `MyFancyApp-LocalDevelopment` scheme, and it'll auto-infer your Mac's local network name and embed it properly, etc.

Bonus round: Application Transport Security
---

While writing this up, I ran into a small, related issue that I felt like others were likely to encounter as well. iOS9 introduces a new feature called Application Transport Security, which effectively mandates that your app only communicates over appropriately-up-to-date HTTPS connections. It's a good thing, and it's on by default, and you should leave it that way! Except, if you followed along with this blog post so far, it will completely and utterly break when you're running your app in Local Development mode, as we're connecting to our Mac over HTTP, not HTTPS (your Mac most likely isn't configured to do that to begin with). So, you'll get a warning like: "App Transport Security has blocked a cleartext HTTP (http://) resource load since it is insecure. Temporary exceptions can be configured via your app's Info.plist file."

Hmm, temporary exceptions you say? As it turns out, you can tell your app to not worry about HTTPS for specific domains by specifying appropriate values in your applications's Info.plist (you can also disable App Transport Security entirely, but you shouldn't do this. You can find more information in [this blog post][7]). In fact, we can use all of our new Local Development tools to add the necessary information to our Info.plist just before the app is copied to your device. Thus, we'll only whitelist your development domains when, well, in development.

To do this, simply add another "Run Script Build Phase" in your application settings' Build Phases tab with the following contents (which lean heavily on our new friend PlistBuddy):

```bash
if [ -f $"${CONFIGURATION_TEMP_DIR}/LocalDevelopmentOverridesEnabled" ]
then

INFO_PLIST="${TARGET_BUILD_DIR}/${INFOPLIST_PATH}"
LOCAL_NETWORK_NAME="$(scutil --get LocalHostName | tr "[:upper:]" "[:lower:]").local"

/usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity:NSExceptionDomains:$LOCAL_NETWORK_NAME:NSIncludesSubdomains bool true" $INFO_PLIST
/usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity:NSExceptionDomains:$LOCAL_NETWORK_NAME:NSThirdPartyExceptionAllowsInsecureHTTPLoads bool true" $INFO_PLIST

fi

exit 0
```

Two small, annoying notes here - one, it looks like App Transport Security doesn't handle uppercase characters well, so we're using `tr` to lowercase your mac's local network name (it's case-insensitive on the OS X side of things anyway). Two, Xcode appears to aggressively cache the generated Info.plist in your target's build directory, meaning that these injected values might stick around longer than they should, even if you change schemes. To fix this, just add a final Run Script Build Phase, this one just before the "Copy Bundle Resources" phase, containing the line:

```bash
rm -f "${TARGET_BUILD_DIR}/${INFOPLIST_PATH}"
```

This simply deletes the cached version of that file, and forces Xcode to re-copy it during the next build.

I hope you found this post enjoyable and (more importantly) useful! If nothing else, it demonstrates the power that custom schemes and build scripts can give you over your Xcode projects.

Oh, one last thing: if you did find this post enjoyable or useful, I'd love it if you'd follow me on Twitter, where I post lots of stuff like this - I'm [@jflinter][8].

Also, huge thanks to [Cameron Spickert][9] and [Mike Lazer-Walker][10] for reading drafts of this post!

[0]: http://blog.carbonfive.com/2011/06/20/managing-ios-configurations-per-environment-in-xcode-4/
[1]: https://ngrok.com/
[2]: http://www.charlesproxy.com/
[3]: https://support.apple.com/kb/PH13790?locale=en_US
[4]: http://nshipster.com/launch-arguments-and-environment-variables/
[5]: http://cameronspickert.com/2014/02/18/custom-launch-arguments-and-environment-variables.html
[6]: http://fgimian.github.io/blog/2015/06/27/a-simple-plistbuddy-tutorial/
[7]: http://www.neglectedpotential.com/2015/06/working-with-apples-application-transport-security/
[8]: https://twitter.com/cameronspickert
[9]: https://twitter.com/cameronspickert
[10]: https://twitter.com/lazerwalker
