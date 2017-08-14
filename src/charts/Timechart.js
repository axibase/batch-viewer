import "./charts.min";

import "./charts.min.css";

const classNamePrefix = 'widget-';

export function initializeWidget(config, contNode){
	var type = config.type = toCapitalCase(config.type) || defaultWidgetType;
	//config.updateinterval = 0;
	config.fastenTooltips = true;
	
	var contEl = d3.select(contNode),
	initClasses = contEl.attr('class'),
	initStyles = contEl.classed(classNamePrefix + type.toLowerCase(), true).attr('style'),
	widget = contNode.__innerWidget__ = appendWidget(config, contNode);
	
	resizeWidget(widget);
	widget.destroy = extendFunction(widget.destroy, function(){
		contNode.__innerWidget__ = null;
		// reset style and class attributes
		contEl.attr('style', initStyles).attr('class', initClasses);
	});
	
	switch(type){
	case 'Gauge':
		widget.progress.alignNode(contNode).redraw();
		break;
	}
	return widget;
}

function resizeWidget(widget, size){
	if (typeof size != 'object') size = resizeWidget.getDefaultSize(widget.config);
	if (size){
		if (!size.isOwn){
			var contNode = widget.config.renderTo;
			contNode.style.width = typeof size.width == 'number' ? size.width + 'px' : size.width;
			contNode.style.height = typeof size.height == 'number' ? size.height + 'px' : size.height;
		}
		widget.resize(size);
	}
}


resizeWidget.getDefaultSize = function(config){
	var size = config.initSize;
	if (!size){
		var rect = config.renderTo.getBoundingClientRect();
		size = {
			width: Math.round(rect.width),
			height: Math.round(rect.height),
			isOwn: true
		};
	}
	return size;
};