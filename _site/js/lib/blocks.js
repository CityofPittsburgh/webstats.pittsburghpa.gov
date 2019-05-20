import d3 from 'd3';

import renderBlock from './renderblock';
import { exceptions, titleExceptions } from './exceptions';
import barChart from './barchart';
import buildTimeSeries from './timeseries';
import formatters from './formatters';
import transformers from './transformers';


const clean_title = function(d) {
  if (d.page_title == '(not set)') {
    return (`${d.domain}` + `${d.page}`)
  } else {
    return d.page_title
  }
}

/* GA API returns wrong domain for BurghsEyeView in downloads + realtime
and for parking authority in realtime. Also, remove http prepend to avoid
hrefs with http://http:// */

  const clean_domain = function(d) {
    if (d.page.includes("BurghsEyeView") || d.page.includes("TreesNAt")) {
      return "pittsburghpa.shinyapps.io"
    } else if (d.domain.includes("pittsburghparking")) {
      return "pittsburghparking.com"
    } else if (d.page_title.includes('webstats')) {
      return "webstats.pittsburghpa.gov"
    } else {
      return d.domain.replace("http://", "")
    }
  }

/*
 * Define block renderers for each of the different data types.
 */

export default {

  // the realtime block is just `data.totals.active_visitors` formatted with commas
  realtime: renderBlock.loadAndRender()
    .render((selection, data) => {
      const totals = data.data[0];
      selection.text(formatters.addCommas(+totals.active_visitors));
    }),

  today: renderBlock.loadAndRender()
    .transform(data => data)
    .render((svg, data) => {
      const days = data.data;
      days.forEach((d) => {
        d.visits = +d.visits;
      });

      const y = function (d) { return d.visits; };

      const series = buildTimeSeries()
        .series([data.data])
        .y(y)
        .label(d => formatters.formatHour(d.hour))
        .title(d => `${formatters.addCommas(d.visits)} visits during the hour of ${formatters.formatHour(d.hour)}m`);

      series.xScale()
        .domain(d3.range(0, days.length + 1));

      series.yScale()
        .domain([0, d3.max(days, y)]);

      series.yAxis()
        .tickFormat(formatters.formatVisits());

      svg.call(series);
    }),

  seven_days: renderBlock.loadAndRender()
    .transform(data => data)
    .render((svg, data) => {
      const days = data.data;
      days.forEach((d) => {
        d.visits = +d.visits;
      });

      const y = function (d) { return d.visits; };

      const series = buildTimeSeries()
        .series([data.data])
        .y(y)
        .label(d => formatters.formatDate(d.date))
        .title(d => `${formatters.addCommas(d.visits)} visits on ${formatters.formatDate(d.date)}`);

      series.xScale()
        .domain(d3.range(0, days.length + 1));

      series.yScale()
        .domain([0, d3.max(days, y)]);

      series.yAxis()
        .tickFormat(formatters.formatVisits());

      svg.call(series);
    }),

  thirty_days: renderBlock.loadAndRender()
    .transform(data => data)
    .render((svg, data) => {
      const days = data.data;
      days.forEach((d) => {
        d.visits = +d.visits;
      });

      const y = function (d) { return d.visits; };

      const series = buildTimeSeries()
        .series([data.data])
        .y(y)
        .label(d => formatters.formatDate(d.date))
        .title(d => `${formatters.addCommas(d.visits)} visits on ${formatters.formatDate(d.date)}`);

      series.xScale()
        .domain(d3.range(0, days.length + 1));

      series.yScale()
        .domain([0, d3.max(days, y)]);

      series.yAxis()
        .tickFormat(formatters.formatVisits());

      svg.call(series);
    }),

  // the OS block is a stack layout
  os: renderBlock.buildBarBasicChart('os'),

  // the windows block is a stack layout
  windows: renderBlock.buildBarBasicChart('os_version'),

  // the devices block is a stack layout
  devices: renderBlock.loadAndRender()
    .transform((d) => {
      const devices = transformers.listify(d.totals.devices);
      return transformers.findProportionsOfMetricFromValue(devices);
    })
    .render(barChart()
      .value(d => d.proportion)
      .format(formatters.floatToPercent))
    .on('render', (selection, data) => {
      /*
         * XXX this is an optimization. Rather than loading
         * users.json, we total up the device numbers to get the "big
         * number", saving us an extra XHR load.
         */
      const total = d3.sum(data.map(d => d.value));
      d3.select('#total_visitors')
        .text(formatters.readableBigNumber(total));
    }),

  // the browsers block is a table
  browsers: renderBlock.buildBarBasicChart('browser'),

  // the IE block is a stack, but with some extra work done to transform the
  // data beforehand to match the expected object format
  ie: renderBlock.buildBarBasicChart('ie_version'),

  cities: renderBlock.buildBarChartWithLabel((d) => {
    // remove "(not set) from the data"
    const cityList = d.data;
    const cityListFiltered = cityList.filter(c => (c.city !== '(not set)') && (c.city !== 'zz'));
    const proportions = transformers.findProportionsOfMetric(
      cityListFiltered,
      list => list.map(x => x.active_visitors),
    );
    return proportions.slice(0, 10);
  }, 'city'),

  countries: renderBlock.buildBarChart((d) => {
    let totalVisits = 0;
    let USVisits = 0;
    d.data.forEach((c) => {
      totalVisits += parseInt(c.active_visitors, 10);
      if (c.country === 'United States') {
        USVisits = c.active_visitors;
      }
    });
    const international = totalVisits - USVisits;
    const data = {
      'United States': USVisits,
      'International &amp; Territories': international,
    };
    return transformers.findProportionsOfMetricFromValue(transformers.listify(data));
  }),

  international_visits: renderBlock.buildBarChartWithLabel((d) => {
    let values = transformers.findProportionsOfMetric(
      d.data,
      list => list.map(x => x.active_visitors),
    );
    values = values.filter(c => c.country !== 'United States');
    return values.slice(0, 15);
  }, 'country'),

  'top-downloads': renderBlock.loadAndRender()
    .transform(d => d.data.slice(0, 10))
    .render(
      barChart()
        .value(d => +d.total_events)
        .label(d => [
          '<span class="name"><a class="top-download-page" target="_blank" href=http://', clean_domain(d), d.page, '>', d.page_title, '</a></span> ',
          '<span class="domain" >', formatters.formatURL(d.page), '</span> ',
          '<span class="divider">/</span> '
        ].join(''))
        .scale(values => d3.scale.linear()
          .domain([0, 1, d3.max(values)])
          .rangeRound([0, 1, 100]))
        .format(formatters.addCommas),
    ),

  // the top pages block(s)
  'top-pages': renderBlock.loadAndRender()
    .transform(d => d.data)
    .on('render', (selection) => {
      // turn the labels into links
      selection.selectAll('.label')
        .each(function (d) {
          d.text = this.innerText;
        })
        .html('')
        .append('a')
        .attr('target', '_blank')
        .attr('title', d => clean_title(d))
        .attr('href', d => exceptions[d.page] || (`http://${clean_domain(d)}` + `${d.page}`))
        .text(d => titleExceptions[d.page] || clean_title(d));
    })
    .render(barChart()
      .label(d => clean_title(d))
      .value(d => +d.pageviews)
      .scale(values => d3.scale.linear()
        .domain([0, 1, d3.max(values)])
        .rangeRound([0, 1, 100]))
      .format(formatters.addCommas)),

  // the top pages realtime block(s)
  'top-pages-realtime': renderBlock.loadAndRender()
    .transform(d => d.data)
    .on('render', (selection) => {
      // turn the labels into links
      selection.selectAll('.label')
        .each(function (d) {
          d.text = this.innerText;
        })
        .html('')
        .append('a')
        .attr('target', '_blank')
        .attr('title', d => clean_title(d))
        .attr('href', d => exceptions[d.page] || (`http://${clean_domain(d)}` + `${d.page}`))
        .text(d => titleExceptions[d.page] || clean_title(d));
    })
    .render(barChart()
      .label(d => clean_title(d))
      .value(d => +d.active_visitors)
      .scale(values => d3.scale.linear()
        .domain([0, 1, d3.max(values)])
        .rangeRound([0, 1, 100]))
      .format(formatters.addCommas)),

};
