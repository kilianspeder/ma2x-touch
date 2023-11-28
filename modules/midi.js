const EventEmitter = require('node:events');
const easymidi = require('easymidi');
const { closestMatch } = require("closest-match");

//display all midi devices
console.log(easymidi.getInputs());
console.log(easymidi.getOutputs());


class MidiController extends EventEmitter {
    constructor(config) {
        super();
        this.name = config.name;

        let all_in = easymidi.getInputs();
        let midi_in = closestMatch(this.name, all_in);
        let all_out = easymidi.getOutputs();
        let midi_out = closestMatch(this.name, all_out);
        console.log("Connection to input '" + midi_in + "' and output '" + midi_out + "'");

        this.input_device = new easymidi.Input(midi_in);
        this.output_device = new easymidi.Output(midi_out);

        this.input_device.on("noteon", this.on_note.bind(this));
        this.input_device.on("cc", this.on_cc.bind(this));
        this.input_device.on("pitch", this.on_pitch.bind(this));
    }

    reset_device() {
        this.output_device.send('reset');
    }

    clear_output(output) {
        for (let i = 0; i < 128; i++) {
            this.output_device.send('noteon', { note: i, velocity: 0, channel: 0 });
            this.output_device.send('cc', { controller: i, value: 0, channel: 0 });
        }
        for (let i = 0; i < 16; i++) {
            this.output_device.send('pitch', { value: 0, channel: i });
        }
    }

    set_fader(name, value) {
        let out_value = this.float_to_fader(value);

        let out_channel = this.fader_name_to_channel(name);

        // console.log("Set channel " + out_channel + " to value " + out_value);
        this.output_device.send('pitch', { value: out_value, channel: out_channel });
    }

    set_button(name, value, channel = 0) {
        let out_note = this.button_name_to_note(name)

        let out_value = this.button_value_to_velocity(value);

        this.output_device.send('noteon', { note: out_note, velocity: out_value, channel: channel });
    }

    // Events from input midi device
    on_note(midi) {
        let out_value = midi.velocity ? true : false;
        let button_name = this.note_to_button_name(midi.note);
        this.emit('button', { name: button_name, value: out_value });
    }

    on_cc(midi) {
        let value = midi.value;
        let encoder_name = this.controller_to_cc_name(midi.controller);
        this.emit('cc', { name: encoder_name, value: value });
    }

    on_pitch(midi) {
        let out_value = this.fader_to_float(midi.value);
        let fader_name = this.channel_to_fader_name(midi.channel);
        this.emit('fader', { name: fader_name, value: out_value });
    }

    // name translation
    fader_name_to_channel(name) {
        return parseInt(name);
    }

    button_name_to_note(name) {
        return parseInt(name);
    }

    channel_to_fader_name(channel) {
        return String(channel);
    }

    controller_to_cc_name(controller) {
        return String(controller);
    }

    note_to_button_name(note) {
        return String(note);
    }

    // value translation
    float_to_fader(value) {
        return parseInt(value * 16383);
    }

    fader_to_float(value) {
        return value / 16383;
    }

    float_to_encoder(value) {
        return value * 127;
    }

    button_value_to_velocity(value) {
        if (value)
            return 127;
        return 0;
    }
}

module.exports = MidiController