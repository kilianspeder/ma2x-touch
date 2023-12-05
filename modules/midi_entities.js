import EventEmitter from "node:events";
import MidiController from "./midi.js"

// Base classes
export class MidiEntity {
    constructor(name, id, type) {
        this.name = name;
        this.id = id;
        this.type = type
    }
}

export class MidiInputEntity extends MidiEntity {
    constructor(name, midi_device, id, type) {
        super(name, id, type);

        /** @type {EventEmitter} */
        this.event_emitter = new EventEmitter()
        midi_device.register(type, id, this.midi_callback.bind(this));
    }

    midi_callback(msg) {
        // Do stuff with a midi message here
        console.log(msg);
    }

    on(eventName, listener) {
        this.event_emitter.on(eventName, listener);
    }
}

export class MidiOutputEntity extends MidiEntity {
    constructor(name, midi_device, id, type) {
        super(name, id, type);
        this.output_device = midi_device.output_device;
    }

    send_value(value, value2 = 0) {
        switch (this.type) {
            case "noteon":
                this.output_device.send("noteon", { note: this.id, velocity: value, channel: value2 });
                break;
            case "cc":
                this.output_device.send("cc", { controller: this.id, value: value, channel: value2 });
                break;
            case "pitch":
                this.output_device.send("pitch", { value: value, channel: this.id })
                break;
        }
    }

    turn_off() {
        this.send_value(0);
    }
}

export class MidiButtonEntity extends MidiInputEntity {
    constructor(name, midi_device, id, type = "noteon") {
        super(name, midi_device, id, type);

        this.state = false;
    }

    midi_callback(msg) {
        this.state = msg.velocity != 0;
        this.event_emitter.emit("value", this.state)
        console.log("Button " + this.name + " " + (this.state ? "pressed" : "released"));
        if (this.state) {
            this.event_emitter.emit("press");
        }
        else {
            this.event_emitter.emit("release");
        }
    }
}

export class MidiFaderEntity extends MidiInputEntity {
    constructor(name, midi_device, id, type = "pitch") {
        super(name, midi_device, id, type);
        this.state = 0;
    }

    midi_callback(msg) {
        this.state = this.raw_value_to_float(msg.value);
        console.log("Fader " + this.name + " set to " + Math.round(this.state * 100) + "%");
        this.event_emitter.emit("value", this.state);
    }

    raw_value_to_float(raw_value) {
        return raw_value / 16383;
    }
}

export class MidiEncoderEntity extends MidiInputEntity {
    constructor(name, midi_device, id, type = "cc") {
        super(name, midi_device, id, type);
        this.state = 0;
    }

    midi_callback(msg) {
        let value = this.raw_value_to_float(msg.value);
        this.state += value;
        console.log("Encoder " + this.name + " set to " + this.state);
        this.event_emitter.emit("value", value);
        this.event_emitter.emit("state", this.state);
        if (value > 0) {
            this.event_emitter.emit("inc", value);
        } else {
            this.event_emitter.emit("dec", -value)
        }
    }

    raw_value_to_float(raw_value) {
        let value = raw_value;
        if (value > 32)
            value = 64 - value;
        return value;
    }
}

export class MidiBinaryLamp extends MidiOutputEntity {
    constructor(name, midi_device, id, type = "noteon") {
        super(name, midi_device, id, type)

        this.state = false;
    }

    set(value) {
        let raw_value = this.float_to_raw_value(value);
        super.send_value(raw_value)
        this.state = value;
    }

    turn_on() {
        this.set(true);
    }

    turn_off() {
        this.set(false);
    }

    float_to_raw_value(value) {
        return value ? 127 : 0;
    }
}

export class MidiDimmerLampEntity extends MidiOutputEntity {
    constructor(name, midi_device, id, type = "noteon") {
        super(name, midi_device, id, type);
        this.state = 0.0;
    }

    set(value) {
        let raw_value = this.float_to_raw_value(value);
        super.send_value(raw_value)
        this.state = value;
    }

    float_to_raw_value(value) {
        return parseInt(value * 127);
    }
}

export class MidiColorLampEntity extends MidiOutputEntity {
    set(red, green, blue) { }
    set_rgb(red, green, blue) {
        this.set(red, green, blue)
    }

    set_hsv(hue, saturation, value) {
        hue = hue % 1;
        saturation = Math.max(0, Math.min(1, saturation));
        value = Math.max(0, Math.min(1, value));
    
        let chroma = value * saturation;
        let huePrime = hue * 6;
        let x = chroma * (1 - Math.abs(huePrime % 2 - 1));
    
        let red, green, blue;
    
        if (0 <= huePrime && huePrime < 1) {
            [red, green, blue] = [chroma, x, 0];
        } else if (1 <= huePrime && huePrime < 2) {
            [red, green, blue] = [x, chroma, 0];
        } else if (2 <= huePrime && huePrime < 3) {
            [red, green, blue] = [0, chroma, x];
        } else if (3 <= huePrime && huePrime < 4) {
            [red, green, blue] = [0, x, chroma];
        } else if (4 <= huePrime && huePrime < 5) {
            [red, green, blue] = [x, 0, chroma];
        } else if (5 <= huePrime && huePrime < 6) {
            [red, green, blue] = [chroma, 0, x];
        } else {
            [red, green, blue] = [0, 0, 0];
        }
    
        let m = value - chroma;
    
        // Adjust values to be in the range [0, 1]
        red = (red + m);
        green = (green + m);
        blue = (blue + m);

        this.set(red, green, blue)
    }
}

export class MidiFaderMotorEntity extends MidiOutputEntity {
    constructor(name, midi_device, id, type = "pitch") {
        super(name, midi_device, id, type);
        this.value = 0
    }
    set(value) {
        this.value = value;
        this.send_value(this.float_to_raw_value(value));
    }

    float_to_raw_value(value) {
        return parseInt(value * 16383);
    }
}
