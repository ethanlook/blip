# Tidepool `viz` architecture proposal

## Background

What are the moving parts in Tidepool's data visualization code? What are the steps between blip's fetching data from the server and the rendering of a data view[^a]?

## Current flow

0. blip (on mounting the `<PatientData />` "page") fetches all diabetes device data for the relevant user via tide-whisperer
0. blip (in the `<PatientData />` "page") calls "nurseshark" (a `tideline` "plugin") to preprocess the data and uses the result to create a `TidelineData` instance[^b]
0. blip (in the `<PatientData />` "page") renders one of the five views, passing it:
    - the `TidelineData` instance
    - a set of default `chartPrefs` (initialized in `PatientData`'s `getInitialState`)
    - BG and timezone-related preferences (some of these can be set via query parameter currently but will soon be user-configurable and persisted to the backend, perhaps as part of the user's profile)
    - optionally an `initialDatetimeLocation` to aid in setting the initial datetime domain for the view
    - a bunch of functions for navigation (between views), viewing notes, and other state changes; for the most part, these are defined on `<PatientData />` and affect the local state of that "page"
0. the relevant `<Chart />` component (e.g., `<Basics />`) renders; all of the chart components still do some or their own data munging (beyond what's pre-munged on the `TidelineData` instance)...some do much more than others.

### Implications

- The current set-up is not really compatible with "dropping in" data paging—by which I mean fetching smaller amounts of data for each user (most recent 30-90 days, for example) and then fetching more whenever the user navigates to the edge of the previously fetched data. The problem is that the `TidelineData` constructor has grown very complex, and you can't easily update it with new data. You can throw out the *old* instance and create a brand-new one from the concatenation of the initially fetched data + the newly fetched data, but then each new instance creation will take longer and longer (this constructor actually takes more time than the "nurseshark" preprocessing, given additions that were made for basics and for CGM in trends view). If we have to implement data paging to relieve load on servers, we could do this, but we'll lose the user-facing benefits that will should be able to achieve in a viz re-architecture, where we can revisit this data initialization process and design it so that we'll be able to feed in new batches of data progressively rather than starting all over on each fetch.
- Because the `chartPrefs` are part of `getInitialState` on `<PatientData />`, all visualization state (e.g., selected filters in the basics view, but also location along the datetime dimension) is *lost* if the user navigates away from `<PatientData />` (to edit profile, etc.) and then back.
- Using a *single* timestamp value to represent the user's location along the datetime dimension across views that are concerned with vastly different types of datetime domains (24 hrs vs. 7/14/28 days (in configured timezone) vs. most recent 2+ calendar weeks) is not sufficient and results in quite a bit of unintuitive app behavior when navigating between views (as well as a lot of convoluted logic in the code). For example, if a user is looking at the weekly view for May 27th - June 9th and then double-clicks on a value on June 4th to go to the daily view and see the detailed context for that value, then...if and when the user navigates back to the weekly view by clicking on "Weekly" in the menu bar (browser "Back" obviously doesn't work since the URL/router does not track which of the views is being rendered), the user will see data for May 22nd - June 4th because the two-week domain has been re-aligned based on the June 4th datetime location taken from the daily view. The more intuitive behavior would be to preserve the original weekly view domain of May 27th - June 9th so that the user can go back and forth between the two views seamlessly. (Of course, if the user had navigated far away from the original weekly domain via the daily view and then navigated back to the weekly view, in that case the weekly view should realign with the new location outside of its original domain.)

## Current component architecture

```
├── <PatientData /> (app/pages/patientdata.js)
│   ├── <Daily /> (app/components/chart/daily.js)
│   │   ├── <DailyChart /> (ditto)
│   ├── <Weekly /> (app/components/chart/weekly.js)
│   │   ├── <WeeklyChart /> (ditto)
│   ├── <Modal /> (app/components/chart/modal.js)
│   │   ├── <ModalChart /> (ditto)
│   ├── <Basics /> (app/components/chart/basics.js)
│   ├── <Settings /> (app/components/chart/settings.js)
│   │   ├── <SettingsChart /> (ditto)
```


## Proposed architecture & flow

0. blip mounts `<PatientData />`, and this "page" is hooked into blip's redux store not via the vanilla redux `connect` function but by a custom connector (see below), which will be part of the new `viz` repo/codebase (although it could live anywhere temporarily, for ease of development during the re-architecture)
0. if `viz` has no data to render (as will always be the case initially), it performs the call to fetch data via a function passed down through props (as is normally the case - just making a distinction here between *blip* fetching data and `viz` *telling* blip to fetch data)
0. blip fetches data and preprocesses it (via async action creator and Web Worker connected up through redux-worker-middleware), then passes it down through props to `viz`
0. each view may still do some data-munging, as appropriate (we want to keep preprocessing to a minimum and eliminate the expensive `TidelineData` all-in-one constructor entirely); if the munging is expensive, `viz` can also employ async action creators & Web Workers
0. since the data fetch control is inverted, `viz` can ask blip for more data whenever the user navigates to the edge of the current view

## Proposed component architecture


First stage, for CGM in trends and Tandem device settings:
```
├── <PatientData /> (app/pages/patientdata.js)
│   ├── <Daily /> (app/components/chart/daily.js)
│   │   ├── <DailyChart /> (ditto)
│   ├── <Weekly /> (app/components/chart/weekly.js)
│   │   ├── <WeeklyChart /> (ditto)
│   ├── <Modal /> (app/components/chart/modal.js)
│   │   ├── <ModalChart /> (ditto, for BGM data) and <Trends /> (viz/views/Trends.js, for CGM data at first, then progressively migrate )
│   ├── <Basics /> (app/components/chart/basics.js)
│   ├── <Settings /> (app/components/chart/settings.js)
│   │   ├── <SettingsChart /> (ditto, for non-Tandem devices) and <TandemSettings /> (viz/components/TandemSettings.js)
```

As we progressively rewrite render components in React, move towards for example:

```
│   ├── <Modal /> (app/components/chart/modal.js)
│   │   ├── <Trends /> (viz/views/Trends.js, for BGM and/or CGM)
```

Then as we work on handling date navigation in a common way across components, the top-level component for each view (i.e., the one not ending in `Chart` where it exists) will be absorbed and replaced by a common component that renders the selection between views, date navigation and other filters (like day of the week, &c):

```
│   ├── <DatavizContainer /> (viz/containers/Dataviz.js)
│   │   ├── <Daily /> (viz/views/Daily.js)
│   ├── <DatavizContainer /> (viz/containers/Dataviz.js)
│   │   ├── <Trends /> (viz/views/Trends.js, for BGM and/or CGM)
```


### what's the custom `connect()`er for?

The custom `connect()`er takes an additional configuration object that will likely contain info about the view in question in order to generate the initial state in the branch of the redux state tree controlled by `viz` and containing sub-branches—likely per-user and then also per-view. This custom `connect()`er architecture is borrowed directly from [`redux-form`](http://redux-form.com/ 'redux form'). Some examples of optional properties configurable through the `reduxForm` custom `connect()`er are: keys for the form fields on the particular form to be rendered and (optionally) `destroyOnUnmount` a boolean to configure whether the entire form state is cleared (from the global redux store) when the component is unmounted.

[^a]: I'll use the term "view" to refer to any of the five interfaces for viewing diabetes device data currently available in blip, which are: daily, weekly, trends, basics, and device settings.

[^b]: This is the object available in the console as `window.tidelineData`.
