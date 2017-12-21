import random
from datetime import timedelta
from functools import partial

import six
from dateutil.parser import parse

from atsd_client import connect_url
from atsd_client.models import Entity, Metric, Series, Sample
from atsd_client.services import EntitiesService, SeriesService, MetricsService

# configuration parameters: begin

START_TIME = parse('2017-11-15T23:02:00Z')
ENTITY_PREFIX = 'axi.asset'
ASSET_COUNT = 3

AGITATION_COUNT_MIN, AGITATION_COUNT_MAX = 2, 5

BATCH_COUNT = 3
BATCH_IDLE_DURATION_MIN, BATCH_IDLE_DURATION_MAX = 1, 8

STAGE_1_DURATION_MIN, STAGE_1_DURATION_MAX = 4, 8
STAGE_2_DURATION_MIN, STAGE_2_DURATION_MAX = 5, 10
STAGE_3_DURATION_MIN, STAGE_3_DURATION_MAX = 16, 24

# value caching: enabled when INTERVAL_MINUTES > 0
THRESHOLD_PERCENT = 1
INTERVAL_MINUTES = 10

connection = connect_url('https://atsd_hostname:8443', 'user', 'password')

# configuration parameters: end

entities_service = EntitiesService(connection)
metrics_service = MetricsService(connection)
svc = SeriesService(connection)


def positive_spline(diff_value, start_value, t, l, x):
    return diff_value * (((x - t).total_seconds() / l.total_seconds()) ** 3) + start_value


def positive_inv_spline(diff_value, start_value, t, l, x):
    return diff_value * (1 + (((x - t).total_seconds() / l.total_seconds()) - 1) ** 3) + start_value


def negative_spline(diff_value, end_value, t, l, x):
    return diff_value * ((1 - ((x - t).total_seconds() / l.total_seconds())) ** 3) + end_value


def linear(diff_value, start_value, t, l, x):
    return start_value if diff_value == 0 else diff_value * (x - t).total_seconds() / l.total_seconds() + start_value


def rand_int(n=65535, start=0):
    return int(random.random() * (n - start)) + start


def next_time(time):
    return time + timedelta(seconds=60)


def next_time_p(procedure, time):
    return time + timedelta(seconds=procedure[1] * 60)


JACKET_TEMPERATURE = 'Jacket Temperature'
AGITATOR_SPEED = 'Agitator Speed'
PRODUCT_TEMPERATURE = 'Product Temperature'

UNIT_BATCH_ID_SUFFIX = ':Unit_BatchID'
UNIT_PROCEDURE_SUFFIX = ':Unit_Procedure'


class SplineHolder:
    def __init__(self):
        self.splines = []

    def put_spline(self, t0, t1, metric, label, spline_builder):
        self.splines.append([t0, t1, metric, label, partial(spline_builder, t0, t1 - t0)])

    def get_spline(self, metric, t):
        for [start, end, m, label, f] in self.splines:
            if start <= t < end and m == metric:
                return f, label
        return None


def prepare_stage_2_leaps(agitation_count):
    stage_2_leaps = []
    for i in range(agitation_count):
        stage_2_leaps.append(['Stage 2: Enable agitator %d' % i, 3 / 4])
        stage_2_leaps.append((['Stage 2: Product temperature extremum %d' % i, 1 / 4]))
        stage_2_leaps.append((['Stage 2: Disable agitator %d' % i, 1]))
    return stage_2_leaps


def prepare_temperature_leaps(stage_2_leaps, agitation_count):
    ptl = {}
    middle = 21.8
    step = (28.1 - middle) / agitation_count
    negative_step = 4.4 + step
    for idx in range(0, len(stage_2_leaps), 3):
        enable = stage_2_leaps[idx]
        extremum = stage_2_leaps[idx + 1]
        disable = stage_2_leaps[idx + 2]
        if idx == 0:
            ptl[enable[0]] = partial(positive_inv_spline, 2, 26.6)
            ptl[extremum[0]] = partial(positive_spline, -11, 28.6)
            ptl[disable[0]] = partial(positive_spline, 4.2, 17.6)
        elif idx == len(stage_2_leaps):
            ptl[enable[0]] = partial(linear, 3.9, middle)
            ptl[extremum[0]] = partial(positive_spline, -4.7, 24.7)
            ptl[disable[0]] = partial(positive_spline, 6.1, 20.0)
        elif idx > len(stage_2_leaps) / 2:
            multiplier = (idx - len(stage_2_leaps) / 2) / 3
            ptl[enable[0]] = partial(linear, step, middle + step * multiplier)
            ptl[extremum[0]] = partial(positive_spline, -negative_step,
                                       middle + step * (multiplier + 1))
            ptl[disable[0]] = partial(positive_spline, negative_step - step * multiplier,
                                      middle + step * (multiplier + 1) - negative_step)
        else:
            ptl[enable[0]] = partial(linear, step, middle)
            ptl[extremum[0]] = partial(positive_spline, -negative_step, 17.4 + negative_step)
            ptl[disable[0]] = partial(positive_spline, 4.4, 17.4)
    return ptl


def update_durations(stage_2_leaps):
    procedures = [['Stage 1: Jacket Heating', 1],
                  ['Stage 1: Static Drying', 9],
                  *stage_2_leaps,
                  ['Stage 2: End', 1],
                  ['Stage 3: Product Cooled Down', 2],
                  ['Stage 3: Product Heating', 2],
                  ['Stage 3: Disable agitator 0', 1],
                  ['Stage 3: Enable agitator 0', 15],
                  ['Stage 3: Agitator maximum', 1 / 2],
                  ['Stage 3: Agitator normal', 1 / 4],
                  ['Stage 3: Agitator disable', 1 / 8],
                  ['Stage 3: Agitator enable', 6],
                  ['Stage 3: Jacket Cooled Down', 1],
                  ['Stage 3: Jacket Heating', 1],
                  ['Stage 3: Product Cooling', 2],
                  ['Stage 3: Disable agitator 1', 1],
                  ['Stage 3: Disable agitator 2', 5],
                  ['Inactive', 1]]

    first_stage_length = 0
    second_stage_length = 0
    third_stage_length = 0
    for [name, duration] in procedures:
        if name.startswith('Stage 1'):
            first_stage_length = first_stage_length + duration
        elif name.startswith('Stage 2'):
            second_stage_length = second_stage_length + duration
        elif name.startswith('Stage 3'):
            third_stage_length = third_stage_length + duration
    ps = []
    batch_idle_duration = rand_int(BATCH_IDLE_DURATION_MAX, BATCH_IDLE_DURATION_MIN)
    stage_1_duration = rand_int(STAGE_1_DURATION_MAX, STAGE_1_DURATION_MIN)
    stage_2_duration = rand_int(STAGE_2_DURATION_MAX, STAGE_2_DURATION_MIN)
    stage_3_duration = rand_int(STAGE_3_DURATION_MAX, STAGE_3_DURATION_MIN)
    for idx, [name, duration] in enumerate(procedures):
        if name == 'Inactive':
            duration = duration * batch_idle_duration
        elif name.startswith('Stage 1'):
            duration = duration * stage_1_duration / first_stage_length
        elif name.startswith('Stage 2'):
            duration = duration * stage_2_duration / second_stage_length
        elif name.startswith('Stage 3'):
            duration = duration * stage_3_duration / third_stage_length
        ps.append([name, duration * 60])
    return ps, batch_idle_duration + stage_1_duration + stage_2_duration + stage_3_duration


def update_metrics_behaviour():
    agitation_count = rand_int(AGITATION_COUNT_MAX, AGITATION_COUNT_MIN)
    stage_2_leaps = prepare_stage_2_leaps(agitation_count)
    jacket_temperature_leaps = dict([(x[0], partial(linear, 0, MAX_JACKET_TEMPERATURE)) for x in stage_2_leaps])
    agitator_speed_leaps = dict(
        [(x[0], partial(linear, 0, 0)) if idx % 3 == 2 else (x[0], partial(linear, 0, 2)) for idx, x in
         enumerate(stage_2_leaps)])
    product_temperature_leaps = prepare_temperature_leaps(stage_2_leaps, agitation_count)

    return stage_2_leaps, [
        [JACKET_TEMPERATURE, {
            'Stage 1: Jacket Heating': partial(positive_spline, MAX_JACKET_TEMPERATURE, 0),
            'Stage 1: Static Drying': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            **jacket_temperature_leaps,
            'Stage 2: End': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            'Stage 3: Product Cooled Down': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            'Stage 3: Product Heating': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            'Stage 3: Disable agitator 0': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            'Stage 3: Enable agitator 0': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            'Stage 3: Agitator maximum': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            'Stage 3: Agitator normal': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            'Stage 3: Agitator disable': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            'Stage 3: Agitator enable': partial(linear, 0, MAX_JACKET_TEMPERATURE),
            'Stage 3: Jacket Cooled Down': partial(negative_spline, 90, MIN_JACKET_TEMPERATURE),
            'Stage 3: Jacket Heating': partial(positive_inv_spline, 5, MIN_JACKET_TEMPERATURE),
            'Stage 3: Product Cooling': partial(linear, 0, -5),
            'Stage 3: Disable agitator 1': partial(positive_inv_spline, 5, -5),
            'Stage 3: Disable agitator 2': partial(linear, 0, 0),
            'Inactive': partial(linear, 0, 0)
        }],
        [AGITATOR_SPEED, {
            'Stage 1: Jacket Heating': partial(linear, 0, MIN_AGITATOR_SPEED),
            'Stage 1: Static Drying': partial(linear, 0, MIN_AGITATOR_SPEED),
            **agitator_speed_leaps,
            'Stage 2: End': partial(linear, 0, 2),
            'Stage 3: Product Cooled Down': partial(linear, 0, 2),
            'Stage 3: Product Heating': partial(linear, 0, 2),
            'Stage 3: Disable agitator 0': partial(linear, 0, MIN_AGITATOR_SPEED),
            'Stage 3: Enable agitator 0': partial(linear, 0, 2),
            'Stage 3: Agitator maximum': partial(linear, 0, MAX_AGITATOR_SPEED),
            'Stage 3: Agitator normal': partial(linear, 0, 2),
            'Stage 3: Agitator disable': partial(linear, 0, MIN_AGITATOR_SPEED),
            'Stage 3: Agitator enable': partial(linear, 0, 2),
            'Stage 3: Jacket Cooled Down': partial(linear, 0, 2),
            'Stage 3: Jacket Heating': partial(linear, 0, 2),
            'Stage 3: Product Cooling': partial(linear, 0, 2),
            'Stage 3: Disable agitator 1': partial(linear, 0, MIN_AGITATOR_SPEED),
            'Stage 3: Disable agitator 2': partial(linear, 0, MIN_AGITATOR_SPEED),
            'Inactive': partial(linear, 0, MIN_AGITATOR_SPEED)
        }],
        [PRODUCT_TEMPERATURE, {
            'Stage 1: Jacket Heating': partial(positive_spline, 2.4, MIN_PRODUCT_TEMPERATURE),
            'Stage 1: Static Drying': partial(positive_inv_spline, 9.2, 17.4),
            **product_temperature_leaps,
            'Stage 2: End': partial(positive_inv_spline, 2, 26.1),
            'Stage 3: Product Cooled Down': partial(negative_spline, 13.1, MIN_PRODUCT_TEMPERATURE),
            'Stage 3: Product Heating': partial(positive_spline, 3.8, MIN_PRODUCT_TEMPERATURE),
            'Stage 3: Disable agitator 0': partial(positive_inv_spline, 7.3, 18.8),
            'Stage 3: Enable agitator 0': partial(positive_inv_spline, 12.5, 26.1),
            'Stage 3: Agitator maximum': partial(positive_inv_spline, 1, 38.6),
            'Stage 3: Agitator normal': partial(positive_inv_spline, 0.4, 39.6),
            'Stage 3: Agitator disable': partial(positive_spline, -1, MAX_PRODUCT_TEMPERATURE),
            'Stage 3: Agitator enable': partial(positive_inv_spline, 0.7, 38.6),
            'Stage 3: Jacket Cooled Down': partial(linear, 0, MAX_PRODUCT_TEMPERATURE),
            'Stage 3: Jacket Heating': partial(linear, -3.3, MAX_PRODUCT_TEMPERATURE),
            'Stage 3: Product Cooling': partial(linear, -6.6, 36.7),
            'Stage 3: Disable agitator 1': partial(linear, -4, 30.1),
            'Stage 3: Disable agitator 2': partial(negative_spline, 3.1, 23),
            'Inactive': partial(linear, -8, 23)
        }]
    ]


def check_send_value(start_time, cur_time, prev_time, caching, cur_value, prev_value):
    if start_time < cur_time and caching:
        elapsed_time = cur_time - prev_time
        diff = abs(cur_value - prev_value)
        return not (metric == AGITATOR_SPEED and prev_value == cur_value or elapsed_time <= timedelta(
            minutes=INTERVAL_MINUTES) and diff <= THRESHOLD_PERCENT * prev_value / 100)


SITE_COUNT = 2
BUILDING_PER_SITE_COUNT = 2

MIN_JACKET_TEMPERATURE, MAX_JACKET_TEMPERATURE = -10, 80
MIN_AGITATOR_SPEED, MAX_AGITATOR_SPEED = 0, 5
MIN_PRODUCT_TEMPERATURE, MAX_PRODUCT_TEMPERATURE = 15, 40

sites = ['svl', 'nur']
buildings = [['A', 'B'], ['C', 'D']]

# prepare entities meta
assets = []
for i in range(ASSET_COUNT):
    site = rand_int(SITE_COUNT)
    site_value = sites[site]
    building_value = buildings[site][rand_int(BUILDING_PER_SITE_COUNT)]
    entity = '%s-%s' % (ENTITY_PREFIX, i)

    assets.append({'id': entity, 'site': site_value, 'building': building_value})
    entities_service.create_or_replace(Entity(entity, tags={'site': site_value, 'building': building_value}))

batch_id = 1400
data_command_splines = []
series = []
metric_and_labels = {JACKET_TEMPERATURE: [], PRODUCT_TEMPERATURE: [], AGITATOR_SPEED: []}

total_duration = timedelta()

# prepare splines
for asset in assets:
    proc = 0
    t = START_TIME
    entity = asset['id']

    dataSplines = SplineHolder()
    data_command_splines.append([asset, dataSplines])

    batches_left = BATCH_COUNT
    total_entity_duration = timedelta()

    while batches_left >= 0:
        procedure_name = ''

        if proc == 0:
            stage_2_leaps, metrics = update_metrics_behaviour()
            procedures, td = update_durations(stage_2_leaps)
            total_entity_duration += timedelta(hours=td)
            series.append(Series(entity, entity + UNIT_BATCH_ID_SUFFIX, data=[Sample(time=t, x=batch_id, value=None)]))
            batch_id += 1
            batches_left -= 1
            procedure_name = 'Stage 1 Static Drying'
        elif procedures[proc][0] == 'Inactive':
            series.append(Series(entity, entity + UNIT_BATCH_ID_SUFFIX, data=[Sample(time=t, x='Inactive', value=None)]))
            procedure_name = 'Inactive'
        elif procedures[proc][0] == 'Stage 2: Enable agitator 0':
            procedure_name = 'Stage 2 Intermittent Agitation'
        elif procedures[proc][0] == 'Stage 3: Product Cooled Down':
            procedure_name = 'Stage 3 Continuous Agitation'

        if procedure_name:
            series.append(
                Series(entity, entity + UNIT_PROCEDURE_SUFFIX, data=[Sample(time=t, x=procedure_name, value=None)]))
        next_t = next_time_p(procedures[proc], t)
        for [metric, splines] in metrics:
            label = entity + '-2510' + metric[0]
            dataSplines.put_spline(t, next_t, metric, label, splines[procedures[proc][0]])
            if label not in metric_and_labels[metric]:
                metric_and_labels[metric].append(label)
        proc = (proc + 1) % len(procedures)
        t = next_t

    if total_entity_duration > total_duration:
        total_duration = total_entity_duration

for metric_name, labels in six.iteritems(metric_and_labels):
    for label in labels:
        metric = Metric(label, label=metric_name)
        if metric_name == AGITATOR_SPEED:
            metric.interpolate = 'PREVIOUS'
        metrics_service.create_or_replace(metric)

caching = INTERVAL_MINUTES > 0
previous_time = START_TIME
previous_value = -1

for [asset, splines] in data_command_splines:
    for [metric, d] in metrics:
        t = START_TIME
        send_value = True
        while t < START_TIME + total_duration:
            spline = splines.get_spline(metric, t)
            if spline:
                current_value = spline[0](t)
                send_value = check_send_value(START_TIME, t, previous_time, caching, current_value, previous_value);
                if send_value:
                    m = spline[1]
                    series.append(Series(asset['id'], m, data=[Sample(time=t, value=current_value)]))
                    if caching:
                        previous_value = current_value
                        previous_time = t

            t = next_time(t)

svc.insert(*series)
