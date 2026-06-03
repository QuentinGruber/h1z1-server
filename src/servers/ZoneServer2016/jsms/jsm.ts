export interface Transition extends TransitionBody {
  eventId: string;
}
export interface TransitionBody {
  from: string[] | null;
  to: string;
  EnterTransition: (() => void) | undefined;
}

export class JSM {
  private _state: keyof typeof this.states = "";
  get state() {
    return this._state;
  }
  states: Record<string, (dt: number) => void> = {};
  private transitionsHashMap: Record<string, TransitionBody> = {};
  constructor(
    states: Record<string, (dt: number) => void>,
    transitions: Transition[],
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
  event(eventId: string) {
    const transition = this.transitionsHashMap[eventId];
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
  onTransition(_from: string, _to: string, _eventId: string) {}
}
