## analytics.pittsburghpa.gov

A project to publish website analytics for the Pittsburgh city government, based on [a project](https://github.com/18F/analytics.usa.gov) by 18F. Data is provided via a separate app: https://github.com/CityofPittsburgh/analytics-reporter

For a detailed description of how the site works, read [18F's blog post on analytics.usa.gov](https://18f.gsa.gov/2015/03/19/how-we-built-analytics-usa-gov/).

## About the components
Ths app uses [Jekyll](https://jekyllrb.com) to build the site, and [Sass](https://sass-lang.com/), [Bourbon](http://bourbon.io), and [Neat](https://neat.bourbon.io) for CSS.

The javascript provided is a [webpacked](https://webpack.js.org/) aggregation of [several different modules](#javascript-modules), leveraging [d3](https://d3js.org/) for the visualizations. [Learn more on the webpack configuration](#webpack-configuration)

## Running locally
Run Jekyll with development settings:

```bash
make dev
npm install
npm run build-dev
```

(This runs `bundle exec jekyll serve --watch --config=_config.yml,_development.yml`.)

### Adding Additional Agencies

1. Ensure that data is being collected for a specific agency's Google Analytics ID. Check out the [analytics-reporter](https://github.com/CityOfPittsburgh/analytics-reporter) repository for more information. Save the URL path for the data collection path.
2. Create a new html file in the `_agencies` directory. The name of the file will be the url path.
  ```bash
  touch _agencies/agencyx.html
  ```
3. Create a new html file in the `_data_pages` directory. Use the same name you used in step 2. This will be the data download page for this agency

  ```bash
  touch _data_pages/agencyx.html
  ```
4. Set the required data for for the new files. (Both files need this data.) example:

  ```yaml
  ---
  name: Agency X # Name of the page
  slug: agencyx # Same as the name of the html files. Used to generate data page links.
  layout: default # type of layout used. available layouts are in `_layouts`
  ---
  ```
5. Agency page: Below the data you just entered, include the page content you want. The `_agencies` page will use the `charts.html` partial and the `_data_pages` pages will use the `data_download.html` partial. example:

```yaml
{% include charts.html %}
```

### Developing with local data

The development settings assume data is available at `/fakedata`. You can change this in `_development.yml`.


### Developing with real live data from `analytics-reporter`

If also working off of local data, e.g. using `analytics-reporter`, you will need to make the data available over HTTP _and_ through CORS.

Various tools can do this. This project recommends using the Node module `serve` (pinned at version 6.5.8):

```bash
npm install -g serve
```

Generate data to a directory:

```
analytics --output [dir]
```

Then run `serve` from the output directory:

```bash
serve --cors
```

The data will be available at `http://localhost:3000` over CORS, with no path prefix. For example, device data will be at `http://localhost:3000/devices.json`.

### Javascript Modules
* **Index** - includes the main dom selection and rendering queue of components, and the entry point for the webpack bundler.
* **lib/barchart** the d3 configuration of the bar charts
* **lib/blocks** an object of the specific components
* **lib/consoleprint** the console messages displayed to users
* **lib/exceptions** agency data to be changed by discrete exception rules
* **lib/formatters** methods to help format the display of visualization scales and values
* **lib/renderblock** d3 manipulator to load and render data for a component block
* **lib/timeseries** the d3 configuration of the timeseries charts
* **lib/transformers** helper methods to manipulate and consolidate raw data into proportional data.

### Deploying the app

The assets for this site, along with the Google Analytics data generated by the companion [analytics-reporter](https://github.com/CityofPittsburgh/analytics-reporter), are stored in Amazon Web Services S3 buckets and served via Cloudfront. There's a staging bucket (`s3://pgh-analytics-reporter-staging`), which serves to [https://dl0m84t2p1zjg.cloudfront.net](https://dl0m84t2p1zjg.cloudfront.net), and a production bucket (`s3://pgh-analytics-reporter-prod`), which serves to [http://analytics.pittsburghpa.gov](http://analytics.pittsburghpa.gov).

You'll need to obtain credentials for the city's AWS account before you can deploy (talk to Nick or James), and configure those credentials using the `awscli` utility (install with Python's package manager via `pip install awscli`). 

Before any deployment, run the test suite with `npm test`. From there, assuming the tests pass, you can use the following command to deploy to staging:

```bash
make deploy_staging
```

Or for production: 

```bash
make deploy_prod
```

These commands will bundle the assets for the relevant environment (staging or prod) and copy the files to the appropriate S3 bucket.

Ideally you should wait a couple days between deployments to staging and to prod in order to allow for some QA in the staging environment, though that may not always be possible in the case of a hot fix.


### Environments

| Environment | Branch | URL |
|-------------| ------ | --- |
| Production | master | http://analytics.pittsburghpa.gov |
| Staging | master | https://dl0m84t2p1zjg.cloudfront.net |

### Webpack Configuration
The application compiles es6 modules into web friendly js via Wepback and the [babel loader](https://webpack.js.org/loaders/babel-loader/).

The webpack configuration is set in the [wepback.config.js](./webpack.config.js).

The current configuration uses babel `present-env`.

The webpack also includes linting using [eslint](https://eslint.org/) leveraging the [AirBnb linting preset](https://www.npmjs.com/package/eslint-config-airbnb).

The webconfig uses the [UglifyJSPlugin](https://webpack.js.org/plugins/uglifyjs-webpack-plugin/) to minimize the bundle.

The resulting uglified bundle is build into `assest/bundle.js`.

#### NPM webpack commands
| Command | purpose |
|-------------| ------ |
| npm run build-dev | a watch command rebuilding the webpack with a development configuration (i.e. no minifiecation) |
| npm run build-prod | a webpack command to build a minified and transpiled bundle.js |

### Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
