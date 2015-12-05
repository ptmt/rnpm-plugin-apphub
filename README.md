Ensure you have installed React Native Package Management ([rnpm](https://github.com/rnpm/rnpm)).

```
  npm install rnpm-plugin-apphub

  # 0. commit
  git commit -am "Add new screen to statistics"

  # 1. build
  xcodebuild -scheme $SCHEME archive -archivePath $ARCHIVE_PATH

  # 2. export
  xcodebuild -exportArchive -archivePath $ARCHIVE_PATH \
    -exportPath $IPA_PATH -exportOptionsPlist $PLIST \

  # 3. upload
  rnpm apphub [appid] [token]

```
If you use workspaces add `-workspace *yourWorkspaceFile*`.
See adhoc-export.plist here https://github.com/gyim/breviar-ios/blob/34353eab0535120968275fd6a2b7e08fb4005886/adhoc-export.plist
