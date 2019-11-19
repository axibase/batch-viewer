//////////////////////// IE11 bug workaround ////////////////////////////////////////////
(function provideSVGClassListForIE11() {
    if ("classList" in SVGElement.prototype) return;
    let classList = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "classList");
    Object.defineProperty(SVGElement.prototype, "classList", classList);
})();
/////////////////////////////////////////////////////////////////////////////////////////

/////////////////////// Array.includes /////////////////////////////////////////////////
function includes(array, item, from = 0) {
    if (!array) { return false; }
    return array.includes ? array.includes(item, from) : array.indexOf(item) >= from;
}

import "bootstrap";
import "bootstrap-slider";

import "./Timeline.less";

const ZOOM_SPEED = 1.6;

/*
    State
    =====
    * Visible units
    * Visible procedures
    * Selected timespan
    * Selected batches
*/

let Palette = {
    _colors: ["steelblue", "orange"],
    getColor(i) {
        return this._colors[i];
    }
}

export class BatchTimeline {
    /**
     * @public
     */
    constructor(parent, data) {
        if (!parent) {
            return;
        }
        this.parent = parent.select ? parent : d3.select(parent);

        this.width = 1200;
        this.height = 600;
        this.margins = [16, 96, 16, 144];

        this.minMiniLaneHeight = 12;
        this.maxMiniLaneHeight = 20;
        this.minPlotLaneHeight = 64;
        this.maxPlotLaneHeight = 96;

        this.batchTotal = data.length;

        this.initData(data);
        this.initTimescales();
        this.initAxis();

        this.panning = this.panning.bind(this);
        this.procedureNames = getDistinctProcedureNames(data);

        this.selectedBatchList = {
            selection: new Map(),
            toggleBatch(batch) {
                if (!this.selection.delete(batch.batchId)) {
                    this.selection.set(batch.batchId, batch);
                }
                this.onChange(Array.from(this.selection.values()));
            },
            contains(batch) {
                return this.selection.has(batch.batchId);
            },
            setSelection(batches, noEmit) {
                this.selection.clear();
                for (let i = 0; i < batches.length; i++) {
                    let batch = batches[i];
                    this.selection.set(batch.batchId, batch);
                }
                if (!noEmit) {
                    this.onChange(batches.slice());
                }
            },
            onChange: batches => this.onBatchSelectionChange(batches)
        }
    }

    onBatchSelectionChange(batches) {

    }

    /**
     * @public
     */
    draw() {
        if (!this.parent) return;

        this.tooltip = this.createTooltip();

        if (this.data && this.data.length > 0) {
            this.drawControls();
        }

        this.plotWidth = this.width - this.margins[1] - this.margins[3];
        this.updateHeight();

        let { plotWidth, plotHeight, miniHeight } = this;

        let unitIds = this.data.map(b => b.key);
        this.plotTimescale
            .range([0, plotWidth]);

        this.plotLanescale
            .rangeRoundBands([0, plotHeight], .1)
            .domain(unitIds);

        this.brushTimescale
            .range([0, plotWidth]);

        this.brushLanescale
            .rangeRoundBands([0, miniHeight], .1)
            .domain(unitIds);
        this.svg = this.parent
            .append("svg")
            .classed("axi-batch-timeline", true)
            .attr("width", this.width)
            .attr("height", this.height + 20);

        this.svg
            .append("defs")
            .append("clipPath")
            .attr("id", "plot-viewport")
            .append("rect")
            .attr("width", plotWidth)
            .attr("height", plotHeight)

        let plotArea = this.svg.append("g");
        let axisArea = this.svg.append("g");

        this.plotLaneAxisArea = axisArea
            .append("g")
            .attr("transform", `translate(${this.margins[3]},0)`)
            .call(this.plotLaneAxis);

        this.brushLaneAxisArea = axisArea
            .append("g")
            .attr("transform", `translate(${this.margins[3]},${plotHeight + 20})`)
            .call(this.brushLaneAxis);

        this.timeAxis = axisArea
            .append("g")
            .classed("axis-time", true)
            .attr("transform", `translate(${this.margins[3]},${plotHeight})`)
            .call(this.plotTimeAxis);

        this.plot = plotArea
            .append("g")
            .attr("clip-path", "url(#plot-viewport)")
            .attr("transform", `translate(${this.margins[3]}, 0)`);

        this.brushTimeAxisArea = axisArea
            .append("g")
            .classed("axis-time", true)
            .attr("transform", `translate(${this.margins[3]},${this.height})`)
            .call(this.brushTimeAxis);

        let panning = this.plot.append("g")
            .classed("pan", true);

        panning
            .append("rect")
            .attr("width", plotWidth)
            .attr("height", plotHeight)
            .attr("fill", "none")
            .attr("pointer-events", "all");
        this.plot = panning;

        this.drawPlot();

        this.brushArea = this.svg
            .append("g")
            .classed("mini", true)
            .attr("transform", `translate(${this.margins[3]}, ${plotHeight + 20})`);

        this.drawBrush();

        let brush = d3.svg.brush()
            .x(this.brushTimescale)
            .extent(this.selectedTimeSpan)
            .on("brush", () => {
                if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
                let extent = brush.extent();
                this.focusTimespan([+extent[0], +extent[1]]);
            });

        this.brush = brush;

        this.brushArea
            .append("g")
            .attr("class", "brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", 1)
            .attr("height", miniHeight - 1);


        this.brushArea
            .select(".extent")
            .classed("axi-brush-extent", true)

        this.brushArea
            .select(".brush")
            .append("rect")
            .classed("axi-brush-mask__left", true)
            .classed("axi-brush-mask", true)
            .attr("height", miniHeight - 1)
            .attr("y", 1)
            .attr("width", this.brushTimescale(this.selectedTimeSpan[0]));

        this.brushArea
            .select(".brush")
            .append("rect")
            .classed("axi-brush-mask", true)
            .classed("axi-brush-mask__right", true)
            .attr("height", miniHeight -1)
            .attr("y", 1)
            .attr("x", this.brushTimescale(this.selectedTimeSpan[1]))
            .attr("width", this.brushTimescale.range()[1] - this.brushTimescale(this.selectedTimeSpan[1]));

        this.brushArea
            .select(".resize.w")
            .append("text")
            .attr("font-size", 10)
            .attr("y", miniHeight + 10)
            .attr("x", -4)
            .attr("text-anchor", "end")
            .text(formatTime(this.selectedTimeSpan[0]));

        this.brushArea
            .select(".resize.e")
            .append("text")
            .attr("font-size", 10)
            .attr("y",  miniHeight + 10)
            .attr("x", 4)
            .attr("text-anchor", "start")
            .text(formatTime(this.selectedTimeSpan[1]));

        this.brushArea
            .on("wheel", () => {
                let evt = d3.event;
                evt.preventDefault();
                let delta = evt.deltaX || evt.deltaY || evt.deltaZ;
                delta = Math.sign(delta);
                let extent = brush.extent();
                // TODO need better solution
                if (extent[1] - extent[0] < 1) return;
                let diam = +extent[1] - +extent[0];
                let offset = diam * (1 - (delta < 0 ? 1 / ZOOM_SPEED : ZOOM_SPEED)) / 2;
                this.focusTimespan([+extent[0] + offset, +extent[1] - offset]);
            });

        panning
            .call(this.panning, plotWidth, brush);

        // Heavy calculation
        this.plotX = this.svg.node().getBoundingClientRect().left + this.margins[3];
    }

    /**
     * @public
     */
    destroy() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
        if (this.svg) {
            this.svg.remove();
        }
        if (this.controls) {
            this.controls.remove();
        }
    }

    /**
     * @private
     */
    drawControls() {
        let controls = this.parent
            .append("div")
            .classed("axi-timeline-controls", true);

        this.controls = controls;

        let _this = this;
        this.unitSelector = controls
            .append("div")
            .classed("axi-timeline-control", true)
            .html("<h4>Assets</h4>")
            .append("select")
            .attr("multiple", true)
            .on("change", function () {
                _this.displayedUnits = $(this).val();
                _this.filterAssets();
            });

        this.unitSelectorOptions = this.unitSelector.selectAll("option")
            .data(this.unitFilter.group().all())

        this.unitSelectorOptions.enter()
            .append("option")
            .text(d => d.key)

        this.batchSearchArea = controls
            .append("div")
            .classed("axi-timeline-control", true)
            .html("<h4>Batch Search</h4>");

        let searchStatus;
        this.batchSearchArea
            .append("input")
            .attr("type", "text")
            .attr("placeholder", "Search batch by name")
            .on("change", function () {
                _this.batchIdMask = this.value;
                let batches = _this.findBatchById(_this.batchIdMask);
                if (searchStatus) {
                    searchStatus
                        .style("display", null)
                        .text(batches.length > 0 ? `Found ${batches.length} batches` : "Nothing found")
                }
                let batch = batches[0];
                if (batch) {
                    let range = batch.endAt - batch.startAt;
                    let offset = range * 0.1;
                    _this.focusTimespan([
                        batch.startAt - offset,
                        batch.endAt + offset
                    ]);
                }
            });

        searchStatus = this.batchSearchArea
            .append("p")
            .classed("axi-batch-search__status", true)
            .style("display", "none")

        this.procedureNameSelector = controls
            .append("div")
            .classed("axi-timeline-control", true)
            .html("<h4>Procedures</h4>")
            .append("select")
            .attr("multiple", true);
        this.procedureNameSelector.selectAll("option")
            .data(this.procedureNames)
            .enter()
            .append("option")
            .text(d => d);

        this.procedureNameSelector.on("change", () => {
            this.displayedProcedures = $(this.procedureNameSelector.node()).val();
            this.drawPlot();
        });


        let sliderContainer = controls
            .append("div")
            .classed("axi-timeline-control", true)
            .html("<h4>Batch Duration</h4>")
            .append("div")
            .classed("slider-container", true);
        sliderContainer
            .append("span")
            .text(formatTimeIntv(this.durationRange[0]));
        this.durationSelector = sliderContainer
            .append("input")
            .attr("type", "text");
        sliderContainer
            .append("span")
            .text(formatTimeIntv(this.durationRange[1]));


        $(this.durationSelector.node())
            .bootstrapSlider({
                range: true,
                // tooltip: "hide",
                min: this.durationRange[0],
                max: this.durationRange[1],
                formatter: range => range.map && range.map(formatTimeIntv).join(" - ")
            })
            .on("change", ({ value }) => {
                this.durationFilter.filterRange([value.newValue[0] - 0.1, value.newValue[1] + 0.1]);
                this.drawPlot();
                this.drawBrush();
            });
    }

    /**
     * @private
     */
    filterAssets() {
        const units = this.displayedUnits;
        if (!units) {
            this.unitFilter.filterAll();
            return;
        }
        this.unitFilter.filter(unit => units.indexOf(unit) >= 0);
        if (this.onDisplayedUnitsChanged) {
            this.onDisplayedUnitsChanged();
        }
    }

    /**
     * @private
     */
    onDisplayedUnitsChanged() {
        if (!this.plot) {
            return;
        }
        this.updateHeight();
        this.plotLanescale
            .domain(this.displayedUnits);
        this.plotLaneAxisArea
            .call(this.plotLaneAxis);
        this.brushLanescale
            .domain(this.displayedUnits);
        this.brushLaneAxisArea
            .call(this.brushLaneAxis);
        this.plot.selectAll(".lane").remove();
        this.brushArea.selectAll(".lane").remove();
        this.drawPlot()
        this.drawBrush();
    }

    updateWidth(width) {
        this.width = width;
        this.plotWidth = this.width - this.margins[1] - this.margins[3];

        let { plotWidth } = this;

        if (!this.svg) {
            return;
        }

        this.plotTimescale
            .range([0, plotWidth]);

        this.brushTimescale
            .range([0, plotWidth]);

        this.svg
            .attr("width", this.width)

        this.svg
            .select("#plot-viewport")
            .select("rect")
            .attr("width", plotWidth);

        this.plot
            .select("rect")
            .attr("width", plotWidth);
        this.plot
            .call(this.panning, plotWidth, this.brush);
        this.drawBrush();
        this.focusTimespan();
    }

    /**
     * @private
     */
    updateHeight() {
        let numAssets = this.data.filter(d => d.value.length).length;
        this.plotHeight = Math.max(360, numAssets * this.minPlotLaneHeight);
        this.miniHeight = Math.max(60, numAssets * this.minMiniLaneHeight);
        this.height = this.plotHeight + this.miniHeight + this.margins[0] + this.margins[2];

        if (!this.svg) {
            return;
        }

        let { plotHeight, miniHeight } = this;


        this.plotLanescale
            .rangeRoundBands([0, plotHeight], .1);

        this.brushLanescale
            .rangeRoundBands([0, miniHeight], .1);

        this.svg
            .attr("height", this.height + 20);

        this.svg
            .select("#plot-viewport")
            .select("rect")
            .attr("height", plotHeight)

        this.brushLaneAxisArea
            .attr("transform", `translate(${this.margins[3]},${plotHeight + 20})`);

        this.timeAxis
            .attr("transform", `translate(${this.margins[3]},${plotHeight})`);

        this.brushTimeAxisArea
            .attr("transform", `translate(${this.margins[3]},${this.height})`);

        let panning = this.plot.append("g")
            .classed("pan", true);

        this.plot
            .select("rect")
            .attr("height", plotHeight);

        this.brushArea
            .attr("transform", `translate(${this.margins[3]}, ${plotHeight + 20})`);

        this.brushArea
            .select(".brush")
            .selectAll("rect")
            .attr("height", miniHeight - 1);

        this.brushArea
            .select(".resize.w")
            .select("text")
            .attr("y", miniHeight + 10);

        this.brushArea
            .select(".resize.e")
            .select("text")
            .attr("y",  miniHeight + 10);
    }

    /**
     * @private
     * @param {number[2]} timespan
     */
    focusTimespan(timespan = this.selectedTimeSpan) {
        timespan = intersect(timespan, this.timeSpan);
        this.selectedTimeSpan = timespan;
        this.drawPlot();
        this.brush.extent(timespan);
        this.brushArea.select(".brush").call(this.brush);

        this.brushArea
            .select(".axi-brush-mask__left")
            .attr("width", this.brushTimescale(timespan[0]));

        this.brushArea
            .select(".axi-brush-mask__right")
            .attr("x", this.brushTimescale(timespan[1]))
            .attr("width", this.brushTimescale.range()[1] - this.brushTimescale(timespan[1]));

        this.brushArea
            .select(".resize.w text")
            .text(formatTime(timespan[0]))
        this.brushArea
            .select(".resize.e text")
            .text(formatTime(timespan[1]))
    }

    /**
     * @private
     */
    createTooltip() {
        let tooltip = new Tooltip()
            .format((batch, procedure) => `
                <div class="axi-batch-tooltip__batch-id">
                    Batch: ${ellipsisInMiddle(batch.batchId, 12, 7)}
                </div>
                <div class="axi-batch-tooltip__unit-id">${batch.unit}</div>
                <table>
                    <tr>
                        <th>Start time:</th>
                        <td>${formatTime(batch.startAt)}</td>
                    </tr>
                    <tr>
                        <th>End time:</th>
                        <td>${formatTime(batch.endAt)}</td>
                    </tr>
                    <tr>
                        <th>Duration:</th>
                        <td>${formatTimeIntv(batch.endAt - batch.startAt)}</td>
                    </tr>
                </table>
                ${ !procedure ? "" : `
                    <hr>
                    <div class="axi-batch-tooltip__procedure">
                        <div class="axi-batch-tooltip__batch-id">
                            ${procedure.name ? "Procedure: " + procedure.name : "Inactive"}
                        </div>
                        <table ${procedure.name ? "" : "hidden"}>
                            <tr>
                                <th>Start time:</th>
                                <td>${formatTime(procedure.at)}</td>
                            </tr>
                            <tr>
                                <th>End time:</th>
                                <td>${formatTime(procedure.to)}</td>
                            </tr>
                            <tr>
                                <th>Duration:</th>
                                <td>${formatTimeIntv(procedure.to - procedure.at)}</td>
                            </tr>
                        </table>
                    </div>
                `}
            `)
            .renderTo(this.parent.select(".tooltips"));

        tooltip.el().classed("axi-batch-tooltip", true);
        return tooltip;
    }

    /**
     * @private
     */
    drawPlot() {
        let plotWidth = this.plotWidth;
        let plotHeight = this.plotHeight;

        this.starts.filterRange([-Infinity, this.selectedTimeSpan[1]]);
        this.ends.filterRange([this.selectedTimeSpan[0], Infinity]);

        if (this.batchIdMask) {
            this.findBatchById(this.batchIdMask)[0];
        }

        this.plotTimescale
            .domain(this.selectedTimeSpan);
        this.timeAxis
            .call(this.plotTimeAxis);

        let range = (([a, b]) => b - a);
        let timespanLength = range(this.timeSpan);
        if (range(this.selectedTimeSpan) < range(this.timeSpan) / this.width) {
            if (!this.plot.select(".non-ideal").node()) {
                this.plot
                    .append("text")
                    .classed("non-ideal", true)
                    .text("Select time interval")
                    .attr("x", plotWidth / 2)
                    .attr("y", plotHeight / 2)
                    .attr("text-anchor", "middle")
                    .attr("font-size", 24)
                    .attr("dy", 4);
            }
        } else {
            this.plot.selectAll(".non-ideal").remove();
        }

        this.drawPlotLanes();
        this.drawPlotBatches();
    }

    /**
     * @private
     */
    drawPlotLanes() {
        let initLaneHeight = this.plotLanescale.rangeBand();
        let laneHeight = Math.min(initLaneHeight, this.maxPlotLaneHeight);
        let laneOffset = Math.max((initLaneHeight - laneHeight) / 2, 0);

        let lanes = this.plot
            .selectAll(".lane")
            .data(this.data.filter(d => d.value.length), d => d.key);

        lanes
            .classed("lane--hidden", ({key}) => this.dimmedUnits && includes(this.dimmedUnits, key))
            .attr("transform", d => `translate(0,${this.plotLanescale(d.key)+laneOffset})`);

        lanes.enter()
            .append("g")
            .attr("data-unitid", d => d.key)
            .classed("lane", true)
            .classed("lane--hidden", ({key}) => this.dimmedUnits && includes(this.dimmedUnits, key))
            .attr("transform", d => `translate(0,${this.plotLanescale(d.key)+laneOffset})`);
        lanes.exit()
            .remove();

        let plot = this.plot.node();
        let _this = this;
        this.plotLaneAxisArea
            .selectAll(".tick")
            .classed("plot__laneaxis-tick", true)
            .attr("data-unitid", d => d)
            .on("click", function () {
                let unit = this.getAttribute("data-unitid");
                if (unit) {
                    if (!_this.dimmedUnits) {
                        _this.dimmedUnits = [unit];
                    } else {
                        let idx = _this.dimmedUnits.indexOf(unit);
                        if (idx < 0) {
                            _this.dimmedUnits.push(unit);
                        } else {
                            _this.dimmedUnits.splice(idx, 1);
                        }
                    }
                }
                let target = plot.querySelector(`.lane[data-unitid="${unit}"]`);
                if (target != null) {
                    target.classList.toggle("lane--hidden");
                }
            })

        this.plotLanes = lanes;
    }

    /**
     * @private
     */
    drawPlotBatches() {
        let batches = this.plotLanes
            .selectAll(".batch")
            .data(d => d.value, v => v.batchId)
            .classed("batch__selected", b => this.selectedBatchList.contains(b))

        batches
            .exit().remove();

        batches
            .selectAll(".batch-length")
            .attr("x", b => this.plotTimescale(b.startAt))
            .attr("width", b => this.plotTimescale(b.endAt) - this.plotTimescale(b.startAt));

        let initLaneHeight = this.plotLanescale.rangeBand();
        let laneHeight = Math.min(initLaneHeight, this.maxPlotLaneHeight);
        let batchLabelHeight = Math.max(laneHeight * 0.2, 20);
        let batchProceduresHeight = laneHeight - batchLabelHeight;

        batches
            .selectAll(".batch-label")
            .attr("transform", b => `translate(${this.plotTimescale(b.startAt)},${batchProceduresHeight})`)
            .each(adaptiveLabel(b => b.batchId, "whitesmoke", "darkslategray", b => this.plotTimescale(b.endAt) - this.plotTimescale(b.startAt), batchLabelHeight))

        let _this = this;
        let batchGroup = batches.enter()
            .append("g")
            .classed("batch", true)
            .classed("batch__selected", b => this.selectedBatchList.contains(b))
            .on("click", function (b) {
                if (!this.preventSelection) {
                    _this.selectedBatchList.toggleBatch(b);
                    // this.classList.toggle("batch__selected");
                    // _this.drawPlot();
                    // _this.drawBrush();
                } else {
                    this.preventSelection = false;
                }
            })
            .on("mousemove", function (batch) {
                let evt = d3.event;
                let target = d3.select(evt.target);
                if (!target.classed("batch-length")) {
                    target = d3.select(evt.target.parentNode);
                    if (target.classed("batch-label")) {
                        _this.tooltip.record(batch)
                    } else {
                        let procedure = target.data()[0];
                        _this.tooltip.record(batch, procedure)
                    }
                } else {
                    _this.tooltip.record(batch, {})
                }
                _this.tooltip.showAt([evt.clientX, evt.clientY]);
            })
            .on("mouseleave", (batch) => {
                this.tooltip.visible(false);
            });

        batchGroup
            .append("rect")
            .classed("batch-length", true)
            .attr("x", b => this.plotTimescale(b.startAt))
            .attr("y", 0)
            .attr("width", b => this.plotTimescale(b.endAt) - this.plotTimescale(b.startAt))
            .attr("height", batchProceduresHeight);

        let label = batchGroup
            .append("g")
            .attr("transform", b => `translate(${this.plotTimescale(b.startAt)},${batchProceduresHeight})`)
            .classed("batch-label", true)
            .each(adaptiveLabel(b => b.batchId, "whitesmoke", "darkslategray", b => this.plotTimescale(b.endAt) - this.plotTimescale(b.startAt), batchLabelHeight))

        let ticks = batches
            .selectAll(".procedure")
            .data(b => b.procedures, p => p.at);

        let buildTickLabel = adaptiveLabel(
            p => p.name,
            "whitesmoke",
            (d, i) => Palette.getColor(i % 2),
            p => this.plotTimescale(p.to) - this.plotTimescale(p.at),
            batchProceduresHeight
        );

        const selected = procedure => {
            return ! this.displayedProcedures
                  || this.displayedProcedures.indexOf(procedure.name) >= 0;
        }

        ticks
            .attr("transform", p => `translate(${this.plotTimescale(p.at)},0)`)
            .classed("procedure__hidden", p => !selected(p))
            .each(buildTickLabel);

        ticks.enter()
            .append("g")
            .classed("procedure", true)
            .classed("procedure__hidden", p => !selected(p))
            .attr("data-procedure", p => p.name)
            .attr("transform", p => `translate(${this.plotTimescale(p.at)},0)`)
            .each(buildTickLabel);

        ticks.exit()
            .remove()

        this.plotBatches = batches;
    }

    /**
     * @private
     */
    drawBrush() {
        this.starts.filterAll();
        this.ends.filterAll();
        this.batchIds.filterAll();

        this.brushTimescale
            .domain(this.timeSpan);
        this.brushTimeAxisArea
            .call(this.brushTimeAxis);

        this.drawBrushLanes();
        this.drawBrushBatches();
    }

    /**
     * @private
     */
    drawBrushLanes() {
        let lanes = this.brushArea
            .select(".lanes")

        if (!lanes.node()) {
            lanes = this.brushArea.append("g").classed("lanes", true);
        }


        let initLaneHeight = this.brushLanescale.rangeBand();
        let laneHeight = Math.min(initLaneHeight, this.maxMiniLaneHeight);
        let laneOffset = Math.max((initLaneHeight - laneHeight) / 2, 0);

        lanes = lanes.selectAll(".lane")
            .data(this.data.filter(v => v.value.length), d => d.key);
        lanes.enter()
            .append("g")
            .attr("class", "lane")
            .attr("transform", d => `translate(0,${this.brushLanescale(d.key) + laneOffset})`);
        lanes.exit()
            .remove();
        this.brushLanes = lanes;
    }

    /**
     * @private
     */
    drawBrushBatches() {
        let initLaneHeight = this.brushLanescale.rangeBand();
        let laneHeight = Math.min(initLaneHeight, this.maxMiniLaneHeight);

        let batches = this.brushLanes
            .selectAll(".batch")
            .data(d => d.value, b => b.batchId)
            .classed("batch__selected", b => this.selectedBatchList.contains(b))

        batches.selectAll("rect")
            .attr("x", b => this.brushTimescale(b.startAt))
            .attr("width", b => this.brushTimescale(b.endAt) - this.brushTimescale(b.startAt))

        batches.enter()
            .append("g")
            .classed("batch", true)
            .classed("batch__selected", b => this.selectedBatchList.contains(b))
            .append("rect")
            .attr("x", b => this.brushTimescale(b.startAt))
            .attr("y", 0)
            .attr("width", b => this.brushTimescale(b.endAt) - this.brushTimescale(b.startAt))
            .attr("height", laneHeight);

        batches.exit()
            .remove();

        this.brushBatches = batches;
    }

    /**
     * @private
     */
    initData(data) {
        let xFilter = crossfilter(data);
        this.units = xFilter.dimension(b => b.unit);
        this.starts = xFilter.dimension(b => b.startAt);
        this.ends = xFilter.dimension(b => b.endAt);
        this.batchIds = xFilter.dimension(b => b.batchId);

        this.durationFilter = xFilter.dimension(b => (b.endAt - b.startAt));
        this.unitFilter = xFilter.dimension(b => b.unit);

        this.data = this.units
            .group()
            .reduce(reduceInsert, reduceRemove, reduceInit)
            .all();

        this.timeSpan = [
            reduceMin(data, "startAt"),
            reduceMax(data, "endAt"),
        ];

        this.durationRange = [
            reduceMin(data, b => b.endAt - b.startAt),
            reduceMax(data, b => b.endAt - b.startAt)
        ]

        let [start, end] = this.timeSpan;
        let range = end - start;

        this.selectedTimeSpan = [start + range * 0.4, end - range * 0.4] ;

    }

    nameMaskToRegexp(mask) {
        return new RegExp(`${mask.replace(/\*/g, ".*")}`, "i");
    }

    findBatchById(batchId) {
        let regexp = this.nameMaskToRegexp(batchId);
        this.starts.filterAll();
        this.ends.filterAll();
        let batch = this.batchIds.filter(
            batchId => regexp.test(batchId)
        ).top(Infinity);
        this.starts.filterRange([-Infinity, this.selectedTimeSpan[1]]);
        this.ends.filterRange([this.selectedTimeSpan[0], Infinity]);
        // this.batchIds.filterAll();
        return batch;
    }

    /**
     * @private
     */
    initTimescales() {
        this.plotTimescale = d3.time.scale();
        this.plotLanescale = d3.scale.ordinal().rangeBands([0, this.plotLaneHeight]);

        this.brushTimescale = d3.time.scale().nice();
        this.brushLanescale = d3.scale.ordinal();
    }

    /**
     * @private
     */
    initAxis() {
        this.plotLaneAxis = d3.svg.axis()
            .scale(this.plotLanescale)
            .orient("left");

        this.brushLaneAxis = d3.svg.axis()
            .scale(this.brushLanescale)
            .orient("left");

        this.plotTimeAxis = d3.svg.axis()
            .scale(this.plotTimescale)
            .orient("bottom");

        this.brushTimeAxis = d3.svg.axis()
            .scale(this.brushTimescale)
            .orient("bottom");
    }

    panning(target, plotWidth, brush) {
        const BUTTON_PRIMARY = 1;

        let chart = this;

        let panning = false;
        let inside = false;
        let panX = 0;
        let selectionPrevented = true;

        target
            .on("mousedown", () => { panning = true; panX = d3.event.x; selectionPrevented = false;})
            .on("mousemove", doPanning.bind(chart))
            .on("mouseout", () => { inside = false; })
            .on("mouseover", () => { inside = true; })
            .on("mouseup", () => { panning = false; })
            .on("touchcancel", () => { inside = true; })
            .on("touchend", () => { inside = false; })
            .on("touchmove", doPanning.bind(chart))
            .on("touchstart", () => { panning = true; panX = d3.event.x; selectionPrevented = false;})
            .on("wheel", doZoom.bind(chart));

        return target;

        function doPanning() {
            if (!panning || !inside || d3.event.buttons !== BUTTON_PRIMARY) {
                return;
            }
            if (!selectionPrevented) {
                let batchNode = d3.event.target;
                while (batchNode && batchNode.classList) {
                    if (batchNode.classList.contains("batch")) {
                        batchNode.preventSelection = true;
                        break;
                    }
                    batchNode = batchNode.parentNode;
                }
                selectionPrevented = true;
            }

            let offset = d3.event.x - panX;
            // Reset panX to prevent multiple rescaling
            panX = d3.event.x;
            this.focusTimespan([
                this.plotTimescale.invert(-offset),
                this.plotTimescale.invert(plotWidth - offset)
            ]);
        }

        function doZoom() {
            let evt = d3.event;
            evt.preventDefault();
            let delta = evt.deltaX || evt.deltaY || evt.deltaZ;
            delta = Math.sign(delta);

            let extent = this.selectedTimeSpan;
            let diam = extent[1] - extent[0];
            let offset = diam * (1 - (delta < 0 ? 1 / ZOOM_SPEED : ZOOM_SPEED)) / 2;
            extent = [extent[0] + offset, extent[1] - offset];

            let targetX = d3.event.clientX - this.plotX;
            let targetVal = this.plotTimescale.invert(targetX);

            let scaleCopy = this.plotTimescale.copy();
            scaleCopy.domain(extent);
            let destVal = scaleCopy.invert(targetX);
            let moveBy = (destVal - targetVal);
            this.focusTimespan([extent[0] - moveBy, extent[1] - moveBy]);
        }
    }
}

function intersect(rangeOne, rangeOther) {
    return [
        Math.max(rangeOne[0], rangeOther[0]),
        Math.min(rangeOne[1], rangeOther[1])
    ]
}

function reduceMin(array, key) {
    if (typeof key === "function") {
        return array.reduce((min, item) => Math.min(min, key(item)), Infinity);
    }
    return array.reduce((min, item) => Math.min(min, item[key]), Infinity);
}

function reduceMax(array, key) {
    if (typeof key === "function") {
        return array.reduce((max, item) => Math.max(max, key(item)), -Infinity);
    }
    return array.reduce((max, item) => Math.max(max, item[key]), -Infinity);
}

function reduceInsert(all, current) {
    all.push(current);
    return all;
}

function reduceRemove(all, toRemove) {
    var idx = all.indexOf(toRemove);
    if (idx >= 0) {
        all.splice(idx, 1);
    }
    return all;
}

function reduceInit() {
    return [];
}

function getDistinctProcedureNames(batches) {
    let resultKeyset = new Set();
    for (let i = 0; i < batches.length; i++) {
        let batch =  batches[i];
        for (let j = 0; j < batch.procedures.length; j++) {
            let proc = batch.procedures[j];
            resultKeyset.add(proc.name);
        }
    }
    return Array.from(resultKeyset);
}

const TextResponsiveQueue = {
    queue: [],
    isUpdateRequested: false,

    scheduleUpdate(textNode, bgNode) {
        this.queue.push({ textNode, bgNode });
        if (!this.isUpdateRequested) {
            requestAnimationFrame(() => {
                this.updateNodes();
            })
            this.isUpdateRequested = true;
        }
    },

    updateNodes() {
        let toRemove = [];
        let queue = this.queue;
        this.queue = [];
        for (let i = 0; i < queue.length; i++) {
            let { textNode, bgNode } = queue[i];
            let fgWidth = 1;
            let bgWidth = 0;
            try {
                fgWidth = textNode.getBBox().width;
                bgWidth = bgNode.getBBox().width;
            } catch (e) {
                // Firefox stuff
            }

            if (fgWidth > bgWidth) {
                toRemove.push(textNode);
            } else {
                textNode.style.visibility = "visible";
            }
        }
        for (let i = 0; i < toRemove.length; i++) {
            d3.select(toRemove[i]).remove();
        }
        this.isUpdateRequested = false;
    }
}

function adaptiveLabel(text, fg, bg, w, h) {
    return function (d, i) {
        let target = d3.select(this);
        let width = typeof w === "function" ? w(d, i) : w;
        let height = typeof h === "function" ? h(d, i) : h;
        let color = typeof fg === "function" ? fg(d, i) : fg;
        let bgColor = typeof bg === "function" ? bg(d, i) : bg;


        let _bg = target.select("rect");
        if (!_bg.node()) {
            _bg = target.append("rect");
        }

        let bgNode = _bg
            .attr("width", width)
            .attr("height", height)
            .attr("fill", bgColor)
            .node();

        if (width < 20) {
            target.select("text").remove();
            return;
        }

        let _fg = target.select("text");
        if (!_fg.node()) {
            _fg = target.append("text");
        }

        let fgNode = _fg
            .attr("x", width / 2)
            .attr("y", height / 2 + 4/* centralize vertically (~ fontSize / 3) */)
            .attr("fill", color)
            .attr("font-size", 12)
            .attr("text-anchor", "middle")
            .style({
                visibility: "hidden"
            })
            .text(typeof text === "function" ? text(d, i) : text)
            .node();

        TextResponsiveQueue.scheduleUpdate(fgNode, bgNode);
    }
}

function ellipsisInMiddle(text, nLeft, nRight) {
    let maxLength = nLeft + nRight + 1;
    if (text.length <= maxLength) return text;

    return `${text.slice(0, nLeft)}&hellip;${text.slice(text.length - nRight)}`;
}

const formatTime = new TimeFormatter("local").getDefaultTimeFormat();

function formatTimeIntv(time) {
    let hours = Math.round(+time / 1000);
    let seconds = hours % 60;
    hours = (hours - seconds) / 60;
    if (hours === 0) { return `${seconds}s`}

    let minutes = hours % 60;
    hours = (hours - minutes) / 60;
    if (hours === 0) { return `${minutes}m:${seconds}s`}

    return `${hours}h:${minutes}m:${seconds}s`;
}
