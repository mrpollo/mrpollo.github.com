/*jslint es5: true, browser: true, devel: true */
var Calendar = function () {
  "use strict";
	var events = [],
		width = 620,
		// height = 720,
		canvasWidth = 600,
		CollisionMaps = [];
	this.formatTime = function (minutes) {
		var h = ((minutes > 720) ? (Math.floor(minutes / 60) % 12) : (Math.floor(minutes / 60))),
			m = ((minutes % 60 === 0) ? "00" : (minutes % 60));
		return (((h === 0) ? 12 : h) + ':' + m);
	};
	this.renderTime = function (timeContainer) {
		if (timeContainer === false) {return false; }
		var i = 0, AMPM = '', HOUR = '';
		for (i = 0; i <= 720; i += 30) {
			AMPM = (i < 180) ? 'AM' : 'PM';
			HOUR = this.formatTime(((9 * 60) + i));
			if (i % 60 === 0) {
				// full hour
				timeContainer.appendChild(this.createHour(HOUR, i, 'TopHour'));
				timeContainer.appendChild(this.createHour(AMPM, i, 'Time'));
			} else {
				// half hour
				timeContainer.appendChild(this.createHour(HOUR, i, 'Time'));
			}
		}
	};
	this.createHour = function (text, top, className) {
		var h = document.createElement('div');
		h.className = className;
		h.style.top = top + 'px';
		h.textContent = text;
		return h;
	};
	this.createEventBox = function (item) {
		var w_padding_and_border = 21,
			h_padding_and_border = 16,
			div = document.createElement('div'),
			e = div.cloneNode(false),
			lb = false,
			t = false,
			l = false;
		e.className = 'EventBox Event_' + item.id;
		e.style.top = item.top + 'px';
		e.style.left = item.left + 'px';
		e.style.width = (item.width - w_padding_and_border) + 'px';
		e.style.height = (item.height - h_padding_and_border) + 'px';
		lb = div.cloneNode(false);
		lb.className = 'LeftBorder';
		lb.style.height = item.height + 'px';
		t = div.cloneNode(false);
		t.className = 'title';
		t.textContent = item.title;
		l = div.cloneNode(false);
		l.className = 'time';
		l.textContent = item.location;
		e.appendChild(lb);
		e.appendChild(t);
		e.appendChild(l);
		return e;
	};
	this.CollideMaps = function (item) {
		var index = false, Maps = [];
		CollisionMaps.forEach(function (e) {
			if (this.item.id !== e.id) {
				if (this.item.end > e.start) {
					// collides
					if (this.item.end > e.end) {
						e.end = this.item.end;
					}
					if (e.elements.indexOf(this.item) === -1) {
						this.index = e.elements.push(this.item);
					}
				}
			}
		}, {item: item, index: index, cal: this});
		this.events.forEach(function (e) {
			var occur = [];
			this.cmaps.forEach(function (e) {
				if (e.elements.indexOf(this.item) !== 0) {
					this.occur.push(e.elements);
				}
			}, {item: e, occur: occur});
			this.maps.push(occur);
		}, {cmaps: CollisionMaps, maps: Maps});
		return true;
	};
	this.collideItem = function (item) {
		var starts = item.start, ends = item.end, elements = [item], key, e, CIndex;
		for (key in this.events) {
			if (this.events.hasOwnProperty(key)) {
				e = this.events[key];
				if (item.id !== e.id) {
					// check bounds collide
					if (e.start > starts && e.start < ends) {
						if (ends < e.end) {
							// update bounds
							ends = e.end;
						}
						// double check for item in array
						if (elements.indexOf(e) === -1) {
							elements.push(e);
						}
					}
				}
			}
		}
		CIndex = CollisionMaps.push({
			start: starts,
			end: ends,
			elements: elements
		});
		return CIndex;
	};
	this.getCollidingMap = function (item) {
		var key, k, elements;
		for (key in CollisionMaps) {
			if (CollisionMaps.hasOwnProperty(key)) {
				elements = CollisionMaps[key].elements;
				for (k in elements) {
					if (elements.hasOwnProperty(k)) {
						if (item.id === elements[k].id) {
							// console.warn('Hit');
							return CollisionMaps[key];
						}
					}
				}
			}
		}
		return false;
	};
	this.addToMaps = function (item) {
		// Check collision with other elements
		var search = this.getCollidingMap(item), collided;
		// if collisions found then return the collision map
		if (search !== false) {
			return search;
		}
		// If no Collision Maps found then
		// Collide with other elements
		collided = this.collideItem(item);
		if (!collided) {
			// Else create new empty Collision Map
			return CollisionMaps.push({
				start: item.start,
				end: item.end,
				elements: [item]
			});
		}
		return collided;
	};
	this.ourDayToHuman = function (item) {
		return (this.formatTime((9 * 60) + item.start) + ((item.start < 180) ? 'AM' : 'PM')) + ' to ' + this.formatTime((9 * 60) + item.end) + ((item.end < 180) ? 'AM' : 'PM');
	};
	/**
	 * Lays out events for a single  day
	 * 
	 * @param array events
	 * An array of event objects. Each event object consists of a start time, end
	 * Time (measured in minutes) from 9am, as well as a unique id. The
	 * Start and end time of each event will be [0, 720]. The start time will
	 * Be less than the end time. The array is not sorted.
	 * 
	 * @return array
	 * An array of event objects that has the width, the left and top positions set,
	 * In addition to start time, end time, and id.  
	 * 
	 **/
	this.layOutDay = function (events) {
		/**
		 * sort events by starting time
		 **/
		events.sort(function (a, b) {
			return a.start - b.start;
		});
		this.events = events;
		this.events.forEach(function (e) {
			e.title = 'Sample Item';
			e.location = this.ourDayToHuman(e);
			e.top = e.start;
			e.height = (e.end - e.start);
			this.addToMaps(e);
			this.pushEvent(e);
		}, this);
		console.log('Number of Collision Blocks Detected:' + CollisionMaps.length);
		// Adjust proportions by collision check
		this.events.forEach(function (item) {
			var colliders = this.getCollidingMap(item), key;
			item.width = this.getWidth();
			item.left = this.getStartingLeft();
			item.width = item.width / colliders.elements.length;
			for (key in colliders.elements) {
				if (colliders.elements.hasOwnProperty(key)) {
					if (item.id === colliders.elements[key].id) {
						item.left = ((item.left)) + (parseInt(key, 10) * item.width);
					}
				}
			}
		}, this);
		return this.events;
	};
	this.getStartingLeft = function () {
		return (width - canvasWidth) / 2;
	};
	this.getWidth = function () {
		return canvasWidth;
	};
	this.getEvents = function () {
		return events;
	};
	this.pushEvent = function (item) {
		return events.push(item);
	};
};

var $ = {};
window.addEventListener("load", function () {
	"use strict";
	console.info('app loaded');
	/*
	More example demo events
	var events = [
		{id : 1, start : 60, end : 120}, // an event from 10am to 11am
		{id : 2, start : 100, end : 240}, // an event from 10:40am to 1pm
		{id : 3, start : 700, end : 720} // an event from 8:40pm to 9pm
	];
	var events = [
		{id : 1, start : 30, end : 150},   // an event from 9:30am to 11:30am
		{id : 2, start : 540, end : 600},  // an event from 6:00pm to 7:00pm
		{id : 3, start : 560, end : 620},  // an event from 6:20pm to 7:20pm
		{id : 4, start : 610, end : 670}  // an event from 7:10pm to 8:10pm
	];
	var events = [
		{id : 1, start : 60, end : 300},   // an event from 10:00am to 12:00am
		{id : 2, start : 120, end : 180},  // an event from 6:00pm to 7:00pm
		{id : 3, start : 240, end : 260},  // an event from 6:20pm to 7:20pm
		{id : 4, start : 610, end : 670}  // an event from 7:10pm to 8:10pm
	];
	var events = [
		{id : 1, start : 30, end : 150},   // an event from 9:30am to 11:30am
		{id : 2, start : 540, end : 600},  // an event from 6:00pm to 7:00pm
		{id : 3, start : 560, end : 620},  // an event from 6:20pm to 7:20pm
		{id : 4, start : 610, end : 670},  // an event from 7:10pm to 8:10pm
		{id : 5, start : 210, end : 270},  // an event from 12:30pm to 1:30pm
		{id : 6, start : 220, end : 280},  // an event from 12:40pm to 1:40pm
		{id : 7, start : 230, end : 290},  // an event from 12:50pm to 1:40pm
		{id : 8, start : 240, end : 360},  // an event from 1:00pm to 3:00pm
		{id : 9, start : 310, end : 370},   // an event from 2:10pm to 3:10pm
		{id : 10, start : 320, end : 350}   // an event from 2:20pm to 2:50pm
	];
	*/
	var events = [
		{id : 1, start : 30, end : 150},   // an event from 9:30am to 11:30am
		{id : 2, start : 540, end : 600},  // an event from 6:00pm to 7:00pm
		{id : 3, start : 560, end : 620},  // an event from 6:20pm to 7:20pm
		{id : 4, start : 610, end : 670}  // an event from 7:10pm to 8:10pm
	];
	console.log('Number of events:', events.length);
	// Assign Calendar to $
	// Initialize with canvas element
	Calendar.call($);
	// Render Hours
	$.renderTime(document.getElementById('TimeContainer'));
	// Render blocks of dates on canvas
	$.layOutDay(events).forEach(function (e) {
		this.appendChild(
			$.createEventBox(e)
		);
	}, document.getElementById('EventContainer'));
}, false);
