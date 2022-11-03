# Tailsofequestria System

This system is a tailsofequestria system that you can use as a starting point for building your own custom systems. It's similar to Simple World-building, but has examples of creating attributes in code rather than dynamically through the UI.

## Install in Foundry:
1. Open Foundry Configuration and Setup screen
2. Click on `Game Systems`
3. Click on `Install System`
4. Enter `https://raw.githubusercontent.com/Lilawoan/ToEFoundryVTT/main/system.json` in the `Manifest URL:` field
5. Click on `Install`

With recent changes we should be able to add this to the systems Foundry knows about by default, we just haven't done it yet.


## Development

### Setup
This repo includes both CSS for the theme and SCSS source files.  By default, the release will recompile the CSS from the SCSS files, so it's safer to update the SCSS files and compile them to CSS.

To setup this project for development you will need `Node.js`.  Go to https://nodejs.org/en/download/ to download the latest version.  After Node.js is installed, you can run `npm install` in this directory to install the dependencies for the scss compiler. After that, just run `npm run gulp` to compile the SCSS and start a process that watches for new changes.

### Sheet Layout

This system includes a handful of helper CSS classes to help you lay out your sheets if you're not comfortable diving into CSS fully. Those are:

* `flexcol`: Included by Foundry itself, this lays out the child elements of whatever element you place this on vertically.
* `flexrow`: Included by Foundry itself, this lays out the child elements of whatever element you place this on horizontally.
* `flex-center`: When used on something that's using flexrow or flexcol, this will center the items and text.
* `flex-between`: When used on something that's using flexrow or flexcol, this will attempt to place space between the items. Similar to "justify" in word processors.
* `flex-group-center`: Add a border, padding, and center all items.
* `flex-group-left`: Add a border, padding, and left align all items.
* `flex-group-right`: Add a border, padding, and right align all items.
* `grid`: When combined with the `grid-Ncol` classes, this will lay out child elements in a grid.
* `grid-Ncol`: Replace `N` with any number from 1-12, such as `grid-3col`. When combined with `grid`, this will layout child elements in a grid with a number of columns equal to the number specified.

### Create Release in Github
1. Go to https://github.com/Lilawoan/ToEFoundryVTT/actions
2. Click on the `Release Creation` workflow on the left.
3. Click on `Run workflow` under the workflow runs
4. Update `Branch`, `Update major version`, and `Update minor version` if applicable
5. Click on `Run workflow`

If you do not see any of the above, you may be missing permissions.  We should probably only release from `master`.  If we need to create a release for another branch, we may need to update this workflow in `.github\workflows\release.yml`

![image](http://mattsmith.in/images/tailsofequestria.png)