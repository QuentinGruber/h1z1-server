export interface Transition<EventTypes> extends TransitionBody {
  eventId: EventTypes;
}
export interface TransitionBody {
  from: string[] | null;
  to: string;
  EnterTransition: (() => void) | undefined;
}

export class JSM<EventTypes extends string | number> {
  private _state: keyof typeof this.states = "";
  get state() {
    return this._state;
  }
  states: Record<string, (dt: number) => void> = {};
  private transitionsHashMap: Partial<Record<EventTypes, TransitionBody>> = {};
  constructor(
    states: Record<string, (dt: number) => void>,
    transitions: Transition<EventTypes>[],
    initialState: string = ""
  ) {
    this.states = states;
    if (initialState) {
      this._state = initialState;
    }
    for (let index = 0; index < transitions.length; index++) {
      const t = transitions[index];
      this.transitionsHashMap[t.eventId] = t;
    }
  }
  tick(dt: number) {
    const currentCallback = this.states[this.state];
    if (currentCallback) {
      currentCallback(dt);
    }
  }
  event(eventId: EventTypes) {
    const transition = this.transitionsHashMap[eventId];
    if (!transition) {
      console.error(`[AI] EventId ${eventId} doesn't exist`);
      return;
    }
    const allowed =
      transition.from === null || transition.from.includes(this.state);
    if (allowed) {
      this.onTransition(this._state, transition.to, eventId);
      this._state = transition.to;
      if (transition.EnterTransition) {
        transition.EnterTransition();
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTransition(_from: string, _to: string, _eventId: EventTypes) {}
}
