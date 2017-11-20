# Batch Viewer

![](images/batch-timeline.png)

## Installation

1. Download Batch Viewer zip archive from [Githib][zip-source].
2. Extract `batch-viewer-master` folder from the archive.
3. Create directory `batch` inside the ATSD portal resource directory.
4. Copy contents of `batch-viewer-master/build` into created batch folder.
5. Start ATSD.
7. Insert sample data (see [instructions](#SampleDataUpload)).
6. Now, the batch viewer page is available at `<atsd_host>/portal/resource/batch/index.html`.

## Sample data upload

1. Assume you have downloaded batch viewer and extracted `batch-viewer-master` folder.
2. Open ATSD Web interface in your browser.
3. Go to Data -> Data Entry (`<atsd_host>/metrics/entry`).
4. Make sure that Command insertion mode is active.
5. Copy the content of `batch-viewer-master/sample-data/data-1.txt` .to **Commands** field and click `Send`.
6. Repeat step 5 for `data-2.txt` and `data-3.txt`.
7. Go to Entities page and make sure you have 10 new entities `axi.asset-*`.

## Tutorial

1. Select sites `nur` and `svl` and then select buildings `B` and `C` from top-left control panel.
![](images/site-select.png)
Use `Ctrl + Click` or `⌘ + Click` to select multiple options.

2. Now you have a list of assets, located at selected sites and buildings, in the top-right panel. Select `axi.asset-3` and `axi.asset-7`.
![](images/assets.png)

3. Scroll down the page. You will see th bath timeline, created on selected assets info, and some batch selectors. 
Batches are represented as rectangles, divided into blue and ornge segments for every procedure of the batch. 

The `Assets` selector controls which assets should be shown on timeline. The `Procedures` selector toggles visibilty of procedures with same type. The `Batch Duration` slider filter batches with duration in given time range. 

The Batch Search field filter only batches which name matches the search mask given as field value. The wildcard mask '*' is allowed

![](images/timeline-overview.png)

4. Click on batches `1440` and `1487` on timeline and scroll down the page. You will see a time chart of ATSD metrics values for selected assets on selected batch time.

![](images/timechart.png)

[zip-source]: https://github.com/axibase/batch-viewer/archive/master.zip

