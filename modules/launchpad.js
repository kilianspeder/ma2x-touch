MidiController = require("./midi.js")

class LaunchpadMidiController extends MidiController {
    constructor() {
        super({ name: "LAUNCHPAD MK2" })
    }

    button_value_to_velocity(value) {
        return value
    }

}

// TESTING

lp = new LaunchpadMidiController();
lp.clear_output()
var color = 0
lp.on('button', function (e) {
    if (!e.value)
        return;

    console.log(e);
    lp.set_button(e.name, color);
    color++;
})

lp.on('cc', function (e) {
    console.log(e);
    lp.set_button(e.name, e.name);
})

for (let i = 0; i < 127; i++) {
    // lp.set_button(i, 5);
    lp.output_device.send('noteon', { note: i, velocity: 50, channel: 0 })
}

// noteon channel 0: on
// noteon channel 1: blinking
// noteon channel 2: fading
// noteon channel 3+: ignored