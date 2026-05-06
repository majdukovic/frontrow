'use strict';

/**
 * Expo config plugin: native-showcase.
 *
 * Copies the hand-rolled Swift + Kotlin screens from `native-showcase/`
 * into the prebuilt `ios/` and `android/` projects on every `expo
 * prebuild`, and wires them up so the JS bridge sees the modules. The
 * point: keep the showcase under version control as plain Swift/Kotlin
 * files (where Xcode + Android Studio give you full IDE support) while
 * letting prebuild regenerate the host projects without clobbering the
 * additions.
 *
 * iOS bridging:
 *   1. Copy the .swift files into ios/FrontRow/
 *   2. Add them to the FrontRow target via the Xcode .pbxproj
 *
 * Android bridging:
 *   1. Copy the package tree into android/app/src/main/java/com/...
 *   2. Append `<activity .../>` inside <application> in AndroidManifest.xml
 *   3. Register `NativeDemoPackage()` in MainApplication.kt
 */

const fs = require('fs');
const path = require('path');
const {
  withDangerousMod,
  withMainApplication,
  withAndroidManifest,
  withXcodeProject,
} = require('@expo/config-plugins');

const SHOWCASE_ROOT = path.resolve(__dirname, '..', 'native-showcase');

const IOS_SOURCES = [
  'FrontRowNativeDemoViewController.swift',
  'FrontRowNativeDemoModule.swift',
];

const ANDROID_PACKAGE_DIR = 'com/frontrow/nativedemo';
const ANDROID_FILES = [
  'NativeDemoActivity.kt',
  'NativeDemoModule.kt',
  'NativeDemoPackage.kt',
];

function copyIfChanged(srcPath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const src = fs.readFileSync(srcPath);
  if (fs.existsSync(destPath)) {
    const cur = fs.readFileSync(destPath);
    if (cur.equals(src)) return false;
  }
  fs.writeFileSync(destPath, src);
  return true;
}

function withCopiedIosSources(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const projectName = cfg.modRequest.projectName || 'FrontRow';
      const targetDir = path.join(cfg.modRequest.platformProjectRoot, projectName);
      for (const file of IOS_SOURCES) {
        const src = path.join(SHOWCASE_ROOT, 'ios', file);
        const dest = path.join(targetDir, file);
        copyIfChanged(src, dest);
      }
      return cfg;
    },
  ]);
}

function withIosTargetMembership(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const projectName = cfg.modRequest.projectName || 'FrontRow';
    for (const file of IOS_SOURCES) {
      const exists = project.hasFile(path.join(projectName, file));
      if (!exists) {
        project.addSourceFile(
          path.join(projectName, file),
          { target: project.getFirstTarget().uuid },
          project.findPBXGroupKey({ name: projectName }),
        );
      }
    }
    return cfg;
  });
}

function withCopiedAndroidSources(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const javaRoot = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
      );
      for (const file of ANDROID_FILES) {
        const src = path.join(SHOWCASE_ROOT, 'android', ANDROID_PACKAGE_DIR, file);
        const dest = path.join(javaRoot, ANDROID_PACKAGE_DIR, file);
        copyIfChanged(src, dest);
      }
      return cfg;
    },
  ]);
}

function withRegisteredAndroidPackage(config) {
  return withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    const importLine = 'import com.frontrow.nativedemo.NativeDemoPackage';
    if (!src.includes(importLine)) {
      src = src.replace(
        /^(package\s+[^\n]+\n)/m,
        `$1\n${importLine}\n`,
      );
    }
    // Register via the standard PackageList override pattern — append
    // our package to the auto-linked list.
    const marker = 'val packages = PackageList(this).packages';
    if (src.includes(marker) && !src.includes('NativeDemoPackage()')) {
      src = src.replace(
        marker,
        `${marker}\n            packages.add(NativeDemoPackage())`,
      );
    }
    cfg.modResults.contents = src;
    return cfg;
  });
}

function withRegisteredAndroidActivity(config) {
  return withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (!application) return cfg;
    const activities = application.activity || [];
    const name = 'com.frontrow.nativedemo.NativeDemoActivity';
    const already = activities.some((a) => a.$['android:name'] === name);
    if (!already) {
      activities.push({
        $: {
          'android:name': name,
          'android:exported': 'false',
        },
      });
      application.activity = activities;
    }
    return cfg;
  });
}

const withNativeShowcase = (config) => {
  config = withCopiedIosSources(config);
  config = withIosTargetMembership(config);
  config = withCopiedAndroidSources(config);
  config = withRegisteredAndroidPackage(config);
  config = withRegisteredAndroidActivity(config);
  return config;
};

module.exports = withNativeShowcase;
