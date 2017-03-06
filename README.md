[![Build Status](https://travis-ci.org/mitsei/fbw-platform-common.svg?branch=master)](https://travis-ci.org/mitsei/fbw-platform-common)  [![Coverage Status](https://coveralls.io/repos/github/mitsei/fbw-platform-common/badge.svg?branch=master)](https://coveralls.io/github/mitsei/fbw-platform-common?branch=master)

# Fly-by-Wire components common to Instructor and Students (web + mobile)


## Development installation
```
git clone https://github.com/wombats-writing-code/fbw-platform-common.git
```

## Development

### Unit tests
Unit tests are for selectors and reducers --- most of the functions there are pure and simple to test. Just run:

```
npm test
```

and mocha will run all files named `*.unit-spec.js`.


### UI component tests
Component tests are for components that go into both apps. To run the test suite:
```
npm run karma
```
The karma runner will run all files named `*.spec.js`, compile them using webpack and launch the Chrome window. Each test has automatic cleanup but if you want to see the component visually in the browser, just comment out the `after()` block.

*Run both suites after making a change!* because changes impact both apps.

# Fly-by-Wire middleman

The FbW middleman is currently housed in a private Heroku repo. There are development and production versions, at https://fbw-web-backend.herokuapp.com and https://fbw-web-backend-dev.herokuapp.com.

To pull from and push to development:
```
git pull dev master
git push dev master
```

To pull from and push to production:
```
git pull production master
git push production master
```

**Code should always be pushed to dev first, and then production** because people will fork and pull from production.

## How it works
Two separate repos are maintained (look at `.git/config` file) to power the development and production versions. In the Heroku CLI, you set environment variables to the dev and production versions separately, e.g. only the production version will have the environment variable `PROD_QBANK_HOST`. This way, when the middleman code is running, it knows whether it's in dev or prod.

To inspect the environment variables in each app, do:
```
heroku config --remote [dev or production]
```

## Backend

This library assumes that you specify the backend URL via `process.env.BACKEND`.
The default backend is `localhost:8888`, if you are running the 
`adaptive-backend` repo locally.
