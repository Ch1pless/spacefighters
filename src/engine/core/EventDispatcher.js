/**
 * @author mrdoob / http://mrdoob.com/
 * @editor ch1pless / https://kylehc.dev/
 */

export class EventDispatcher {

  addEventListener(type, listener) {
    if (this._listeners === undefined) this._listeners = {};

    if (this._listeners[type] === undefined)
      this._listeners[type] = [];

    if (this._listeners[type].indexOf(listener) === -1)
      this._listeners[type].push(listener);
  }

  hasEventListener(type, listener) {
    if (this._listeners === undefined) return false;

    const listenerArray = this._listeners[type];

    if (listenerArray !== undefined) {
      const index = listenerArray.indexOf(listener);
      if (index !== -1)
        listenerArray.splice(index, 1);
    }
  }

  dispatchEvent(event) {
    if (this._listeners === undefined) return;

    const listenerArray = this._listeners[event.type];

    if (listenerArray !== undefined) {
      event.target = this;

      // Make a copy, in case listeners are removed while iterating.
      const array = [...listenerArray]

      for (let i = 0; i < array.length; ++i)
        array[i].call(this, event);

    }
  }

}