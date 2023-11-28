MidiController = require("./midi.js");
BiMap = require("bidirectional-map");

var button_names = new BiMap({
    "buttonEncoderDec15": 46,
    "buttonEncoderInc15": 47,
    "buttonEncoderDec16": 48,
    "buttonEncoderInc16": 49,
    "buttonMain": 50,
    "buttonA": 84,
    "buttonB": 85,
    "buttonLoop": 86,
    "buttonPrev": 91,
    "buttonNext": 92,
    "buttonStop": 93,
    "buttonPlay": 94,
    "buttonRec": 95,
    "buttonTouchMain": 112,
})

for (let i = 0; i < 8; i++) {
    // Bottom row 
    button_names.set("button" + (i + 1), i);
    // Top row
    button_names.set("button" + (i + 1) + "1", i + 8);
    // Middle row
    button_names.set("button" + (i + 1) + "2", i + 16);
    // Lower upper row
    button_names.set("button" + (i + 1) + "3", i + 24);
    // Touch fader buttons
    button_names.set("buttonTouch" + (i + 1), i + 104);
}
for (let i = 0; i < 14; i++) {
    // Encoder buttons (work up to encoder 14)
    button_names.set("buttonEncoder" + (i + 1), i + 32)
}

class XTouchMidiController extends MidiController {
    constructor() {
        super({ name: "X-TOUCH COMPACT" })
        
        let encoder_mode = "fan";
        switch(encoder_mode){
            case "single":
                this.encoder_mode_offset = 0;
                break;
            case "pan":
                this.encoder_mode_offset = 1;
                break;
            case "fan":
                this.encoder_mode_offset = 2;
                break;
            case "spread":
                this.encoder_mode_offset = 3;
                break;
        }
    }

    reset_device() {
        this.output_device.send('sysex', [0xf0, 0x40, 0x41, 0x42, 0x59, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF7])
        // TODO: Wait for response
        // {"bytes":[240,64,65,66,89,2,2,2,2,1,1,1,1,247],"_type":"sysex"}
    }

    set_encoder(name, value) {
        let out_value = this.float_to_encoder(value);

        let out_controller = this.encoder_name_to_controller(name);

        this.output_device.send('cc', { controller: out_controller, value: out_value, channel: 0 });
    }

    on_cc(midi) {
        let value = midi.value;
        if (value > 32)
            value = 64 - value;

        let encoder_name = this.controller_to_cc_name(midi.controller);
        this.emit('encoder', { name: encoder_name, value: value });
    }

    fader_name_to_channel(name) {
        let channel;
        if (name.startsWith('fader')) {
            let channel_str = name.substring('fader'.length);
            if (channel_str == 'Main') {
                return 8;
            }
            channel = parseInt(channel_str);
            if (channel >= 1 && channel <= 8)
                return channel - 1;
            console.error("Could not find fader name " + name);
        }
    }

    channel_to_fader_name(channel) {
        if (channel >= 0 && channel <= 7)
            return "fader" + (channel + 1);
        if (channel == 8)
            return "faderMain";
    }

    encoder_name_to_controller(name) {
        let controller;
        if (name.startsWith('encoder')) {
            let channel_str = name.substring('encoder'.length);
            controller = parseInt(channel_str);
            if (controller >= 1 && controller <= 8) {
                return controller + 47
            }
        }
        console.error("Could not translate encoder name " + name);
    }

    controller_to_cc_name(controller) {
        return "encoder" + (controller - 15);
    }

    button_name_to_note(name) {
        let value = button_names.get(name);
        if (name.startsWith("buttonTouch") || name.startsWith("buttonEncoder"))
            value = null
        if (value == null) {
            console.error("Could not find name " + name);
        }
        return value;
    }

    note_to_button_name(note) {
        let value = button_names.getKey(note);
        if (value == null) {
            console.error("Could not find note " + note);
        }
        return value;
    }

    float_to_encoder(value) {
        if (value == -1)
            return 0;
        return 1 + parseInt(value * 10) + 16 * this.encoder_mode_offset
    }
}

module.exports = XTouchMidiController


// TESTING

xt = new XTouchMidiController();
// xt.reset_device();
// YOU NEED TO WAIT AFTER THAT
xt.clear_output()
xt.set_button("button1", true);
xt.set_button("buttonA", true);
xt.set_button("buttonPrev", true);

xt.set_fader("fader3", 0.3);
xt.set_fader("faderMain", 1.0);

xt.set_encoder("encoder4", 0);
xt.set_encoder("encoder7", 0.7);

xt.on('button', function (e) { console.log(e) });
xt.on('fader', function (e) { console.log(e) });
xt.on('encoder', function (e) { console.log(e) });

xt.on('button', function (e) {
    xt.set_button(e.name, e.value);
})

fader_values = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

xt.on('encoder', function (e) {
    let i = e.name.substring('encoder'.length) - 1;
    fader_values[i] = fader_values[i] + parseInt(e.value) * 0.01;
    if (fader_values[i] < 0)
        fader_values[i] = 0
    else if (fader_values[i] > 1)
        fader_values[i] = 1
    xt.set_fader("fader" + (i + 1), fader_values[i])
})

xt.on("fader", function (e) {
    i = e.name.substring("fader".length);
    if (i == "Main")
        return
    xt.set_encoder("encoder" + i, e.value);
})


/* NOTES:

reset x-touch
output.send('sysex', [0xf0, 0x40, 0x41, 0x42, 0x59, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF7])
erfolgreich antwort: sysex: {"bytes":[240,64,65,66,89,2,2,2,2,1,1,1,1,247],"_type":"sysex"}


Encoder LED Set: CC48-55
    0 all off,
    1-11 single on,
    32 all off,
    33-42 fill on

fader setzen und lesen: pitch mit 0 bis 16368 und {value: x, channel: #Fader}

 */