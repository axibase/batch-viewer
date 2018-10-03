# Batch Viewer

![](images/batch-timeline.png)

## Table of Contents

* [Overview](#overview)
* [Demo](#demo)
* [Installation](#installation)
  * [Copy Resources](#copy-resources)
  * [Insert Sample Data](#insert-sample-data)
  * [Open Viewer](#open-viewer)
* [Getting Started](#getting-started)

## Overview

The **Batch Viewer** is a visual interface which compares key metrics across multiple assets and manufacturing tasks to improving process efficiency and equipment utilization by identifying patterns, trends, and outliers.

The installation process requires copying **Batch Viewer** files to the server where ATSD is running. Access to the ATSD server console is required to accomplish this task.

## Demo

View a live [**Batch Viewer** demo](https://apps.axibase.com/batch/).

## Installation

### Copy Resources

Open a console session into the ATSD server.

Download the Batch Viewer [archive](https://github.com/axibase/batch-viewer/archive/master.zip) and extract it into the directory `/opt/atsd/atsd/conf/portal/batch`.

```sh
ATSD_HOME=${ATSD_HOME:-/opt/atsd/atsd}
BATCH_DIR=${ATSD_HOME}/conf/portal/batch
mkdir -p $BATCH_DIR
curl -o $BATCH_DIR/master.zip https://codeload.github.com/axibase/batch-viewer/zip/master
unzip $BATCH_DIR/master.zip -d $BATCH_DIR
cp -r $BATCH_DIR/batch-viewer-master/build/* $BATCH_DIR/
rm -r $BATCH_DIR/master.zip $BATCH_DIR/batch-viewer-master
```

The required directory structure is shown here:

```txt
/opt
  /atsd
    /atsd
      /conf
        /portal
          /batch
            index.html
            assets
            ...
```

### Insert Sample Data

Open the **Data > Data Entry** page.

![](images/data-insert.png)

Copy [sample data](sample-data/commands.txt) into the **Commands** field and click **Send**.

Verify that the **Entities** tab shows three entities `axi.asset-*`.

![](images/asset-entities.png)

Verify that the **Metrics** tab shows metrics `axi.asset-*`.

![](images/axi-metrics.png)

### Open Viewer

Verify that the **Batch Viewer** is accessible at `https://atsd_hostname:8443/portal/resource/batch/index.html`

The Viewer should display two sites in the top menu.

![](images/first-run.png)

## Getting Started

1. Select sites `nur` and `svl` and then select buildings `B` and `C` from the top-left control panel.

    ![](images/site-select.png)

    > Use `Ctrl + Click` or `⌘ + Click` to choose multiple sites and buildings.

2. Once you have selected buildings, view the list of equipment assets in the top-right panel. Select `axi.asset-2` and `axi.asset-2`.

    ![](images/assets.png)

    > Use `Ctrl + Click` or `⌘ + Click` to select multiple assets.

3. Scroll down and locate the scrollable and zoomable timeline containing manufacturing batches for the selected assets.

    A `batch` is the interval of time the equipment executes an assigned manufacturing task. Each `batch` is composed of one or more procedures, executed sequentially. Every `batch` is represented as a rectangle, divided into blue and orange segments for every procedure of the `batch`. Idle time between procedures is colored grey.

    * The `Assets` control contains assets displayed on the timeline.
    * The `Procedures` selector toggles the visibilty of procedures of the same type.
    * The `Batch Duration` slider filters batches that completed within the specified time range. 
    * The `Batch Search` field finds batches which name contains the specified text. The match is case-insensitive and supports `'*'` as the wildcard character.

    ![](images/timeline-overview.png)

4. Click batches `1401` and `1409` on the timeline and scroll down. Locate the Time Chart which consists of metrics for the selected assets for the interval of time to fit selected batches. Metrics for multiple batches are re-based to a start date in order to illustrate metric values relative to batch start time.

      ![](images/timechart.png)

5. Click `Interpolation` to enable time series regularization with the specified period or step function.

    ![](images/timechart-interpolate.png)
