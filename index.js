const events = [
  {
    start: 0,
    duration: 15,
    title: 'Exercise',
  },
  {
    start: 25,
    duration: 30,
    title: 'Travel to work',
  },
  {
    start: 30,
    duration: 30,
    title: 'Plan day',
  },
  {
    start: 60,
    duration: 15,
    title: 'Review yesterday\'s commits',
  },
  {
    start: 100,
    duration: 15,
    title: 'Code review',
  },
  {
    start: 180,
    duration: 90,
    title: 'Have lunch with John',
  },
  {
    start: 360,
    duration: 30,
    title: 'Skype call',
  },
  {
    start: 400,
    duration: 45,
    title: 'Follow up with designer',
  },
  {
    start: 405,
    duration: 30,
    title: 'Push up branch',
  },
];

class Event {
  constructor({ id, start, duration, title, intToPx }) {
    this.id = id;
    this.title = title;
    this.duration = duration;
    this.start = start;
    this.end = this.start + this.duration;
    this.height = this.duration;
    this.width = undefined;
    this.intToPx = intToPx;
    this.offsetX = 65;
  }

  setHtml() {
    const eventBlock = document.createElement('div');
    const eventTitle = document.createElement('p');
    const eventContentWrapper = document.createElement('div');
    const eventDeletionButton = document.createElement('button');

    eventBlock.setAttribute('id', this.id);
    eventDeletionButton.setAttribute('type', 'button');
    eventTitle.innerText = this.title;

    eventBlock.classList.add('scheduler__event');
    eventTitle.classList.add('scheduler__event-title');
    eventContentWrapper.classList.add('scheduler__event-content');
    eventDeletionButton.classList.add('scheduler__event-button', 'js-remove-event');

    eventBlock.style.cssText = `
      height:${this.duration * this.intToPx}px; 
      width:${this.width}px; 
      left:${this.offsetX}px; 
      top:${this.start * this.intToPx}px;`;

    eventContentWrapper.append(eventDeletionButton);
    eventContentWrapper.append(eventTitle);
    eventBlock.append(eventContentWrapper);

    return eventBlock;
  }
}

class Scheduler {
  static _defaultIntToPx = 2;
  static _defaultEventWidth = 200;
  static _defaultEventsGap = 20;

  constructor(container, eventList = [], timeRange = [0, 12], halfHours = true) {
    this.hasHalfHours = halfHours;

    this.container = container;
    this.timeTableContainer = this.container.querySelector('.scheduler__time-table');
    this.timeRangeArray = this.generateTimeRange(timeRange);

    this.events = this.mapEventsList(eventList);
  }

  getSafeId(length = 10) {
    return Math.random().toString(36).substring(2, length);
  }

  start() {
    this.renderTimeTable();
    this.setEventsPositioning();
    this.populateEvents();
    this.addListeners(['removeEvent', 'addEvent', 'toggleForm']);
  }

  addListeners(listeners) {
    listeners.forEach((listener) => this.addListenerCallback(listener));
  }

  addListenerCallback(listener) {
    switch (listener) {
      case 'removeEvent':
        this.container.addEventListener('click', this.removeEvent.bind(this));
        break;
      case 'toggleForm':
        this.container.addEventListener('click', this.toggleForm.bind(this));
        break;
      case 'addEvent':
        this.container.addEventListener('submit', this.addEvent.bind(this));
        break;
    }
  }

  generateTimeRange(range) {
    const [start, end] = range;
    const resultingRange = [];

    for (let i = start; i <= end; i += 1) {
      const time = [];

      const stamp = `${i}:00`;
      time.push(stamp);

      if (this.hasHalfHours && i !== end) {
        const halfStamp = `${i}:30`;
        time.push(halfStamp);
      }

      resultingRange.push(time);
    }

    return resultingRange;
  }

  mapEventsList(eventList) {
    return this.sortEvents(eventList.map((event) =>
      new Event(
        {
          ...event,
          id: this.getSafeId(),
          intToPx: Scheduler._defaultIntToPx
        })));
  }

  sortEvents(eventList) {
    return [...eventList].sort((a, b) => a.start - b.start);
  }

  setEventsPositioning() {
    this.events.map((event) => {
      const clashingEvents = [];

      Object.values(this.events).forEach((eventToCompare) => {
        const isCollidingEvent = event.end > eventToCompare.start && event.start < eventToCompare.start;

        if (isCollidingEvent) {
          clashingEvents.push(eventToCompare);
        }
      });

      if (clashingEvents.length) {
        const calculatedEventWidth = Math.floor((Scheduler._defaultEventWidth / clashingEvents.length));

        clashingEvents.forEach((clashingEvent) => {
          clashingEvent.width = calculatedEventWidth;
          event.width = calculatedEventWidth;

          if (event.offsetX === clashingEvent.offsetX) {
            clashingEvent.offsetX += (calculatedEventWidth + Scheduler._defaultEventsGap);
          }
        });
      } else {
        event.width = Scheduler._defaultEventWidth;
      }
    });
  }

  renderTimeTable() {
    this.timeRangeArray.forEach((timeRange) => {
      const [fullHour, halfHour] = timeRange;

      const timeBlock = document.createElement('div');
      timeBlock.classList.add('scheduler__time-block');

      const fullHourField = document.createElement('p');
      fullHourField.classList.add('scheduler__stamp');
      fullHourField.innerText = fullHour;
      timeBlock.append(fullHourField);

      if (halfHour) {
        const halfHourField = document.createElement('span');
        halfHourField.classList.add('scheduler__stamp', 'scheduler__stamp--half');
        halfHourField.innerText = halfHour;
        timeBlock.append(halfHourField);
      }

      this.timeTableContainer.append(timeBlock);
    });
  }

  populateEvents() {
    const eventsHtmlElements = this.events.map((event) => event.setHtml(this));
    this.timeTableContainer.append(...eventsHtmlElements);
  }

  repopulateEvents() {
    this.eventsContainer.innerHTML = '';

    this.setEventsPositioning();
    this.populateEvents();
  }

  removeEvent({ target }) {
    if (target.classList.contains('js-remove-event')) {
      const eventBlock = target.closest('.scheduler__event');
      const { id: eventToRemoveId } = eventBlock;
      eventBlock.remove();

      this.events = this.events.filter((event) => event.id !== eventToRemoveId);

      eventBlock.remove();
      this.repopulateEvents();
    }
  }

  validateForm(form) {
    const inputs = [...form.querySelectorAll('input')];
    return inputs.every((input) => input.value !== '');
  }

  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');

    const parsedH = Number(hours) - 8;
    const parsedM = Number(minutes);

    return parsedH * 60 + parsedM;
  }

  addEvent(event) {
    event.preventDefault();
    const isValid = this.validateForm(event.target);

    if (!isValid) {
      return;
    }

    const fieldToValue = {};
    const inputs = [...event.target.querySelectorAll('input')];

    inputs.forEach((input) => {
      fieldToValue[input.name] = input.value;
    })

    const parsedStart = this.parseTime(fieldToValue.start);
    const parsedEnd = this.parseTime(fieldToValue.end);

    const invalidTimeRange = parsedStart < 0 || parsedEnd > 540;

    if (invalidTimeRange) {
      return;
    }

    const newEvent = {
      start: parsedStart,
      duration: parsedEnd - parsedStart,
      title: fieldToValue.title,
      id: this.getSafeId(),
      intToPx: Scheduler._defaultIntToPx,
    };

    this.events = this.sortEvents([ ...this.events, new Event(newEvent)]);
    this.repopulateEvents();
  }

  toggleForm({ target }) {
    if (target.classList.contains('js-scheduler-form-toggle')) {
      const actionContainer = target.closest('.scheduler__action');

      actionContainer.classList.toggle('is-active');
    }
  }
}


const container = document.querySelector('.scheduler');
const eventsScheduler = new Scheduler(container, events, [8, 17]);
eventsScheduler.start();
