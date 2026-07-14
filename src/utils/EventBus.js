/**
 * EventBus — Simple pub/sub for decoupled communication.
 */
export class EventBus {
  static _listeners = new Map();

  static on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  static off(event, callback) {
    const list = this._listeners.get(event);
    if (list) {
      const i = list.indexOf(callback);
      if (i > -1) list.splice(i, 1);
    }
  }

  static emit(event, data) {
    const list = this._listeners.get(event);
    if (list) list.forEach(cb => cb(data));
  }

  static clear() { this._listeners.clear(); }
}

export const EVENTS = {
  ERA_CHANGE:     'ERA_CHANGE',
  SCROLL_PROGRESS:'SCROLL_PROGRESS',
  RENDER_TICK:    'RENDER_TICK',
  RESIZE:         'RESIZE',
  EXPERIENCE_READY: 'EXPERIENCE_READY',
  AUDIO_UNLOCK:   'AUDIO_UNLOCK',
};
