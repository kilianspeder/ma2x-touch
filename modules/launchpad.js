import MidiController from "./midi.js";
import { MidiButtonEntity, MidiColorLampEntity } from "./midi_entities.js"

const LP_COLOR_PALETTE = [[0, 0, 0], [28, 28, 28], [124, 124, 124], [252, 252, 252], [255, 78, 72], [254, 10, 0], [90, 0, 0], [24, 0, 2], [255, 188, 99], [255, 87, 0], [90, 29, 0], [36, 24, 2], [253, 253, 33], [253, 253, 0], [88, 88, 0], [24, 24, 0], [129, 253, 43], [64, 253, 1], [22, 88, 0], [19, 40, 1], [53, 253, 43], [0, 254, 0], [0, 88, 1], [0, 24, 0], [53, 252, 71], [0, 254, 0], [0, 88, 1], [0, 24, 0], [50, 253, 127], [0, 253, 58], [1, 88, 20], [0, 28, 14], [47, 252, 177], [0, 251, 145], [1, 87, 50], [1, 24, 16], [57, 190, 255], [0, 167, 255], [1, 64, 81], [0, 16, 24], [65, 134, 255], [0, 80, 255], [1, 26, 90], [1, 6, 25], [71, 71, 255], [0, 0, 254], [0, 0, 90], [0, 0, 24], [131, 71, 255], [80, 0, 255], [22, 0, 103], [10, 0, 50], [255, 72, 254], [255, 0, 254], [90, 0, 90], [24, 0, 24], [251, 78, 131], [255, 7, 83], [90, 2, 27], [33, 1, 16], [255, 25, 1], [154, 53, 0], [122, 81, 1], [62, 101, 0], [1, 56, 0], [0, 84, 50], [0, 83, 127], [0, 0, 254], [1, 68, 77], [26, 0, 209], [124, 124, 124], [32, 32, 32], [255, 10, 0], [186, 253, 0], [172, 236, 0], [86, 253, 0], [0, 136, 0], [1, 252, 123], [0, 167, 255], [2, 26, 255], [53, 0, 255], [120, 0, 255], [180, 23, 126], [65, 32, 0], [255, 74, 1], [130, 225, 0], [102, 253, 0], [0, 254, 0], [0, 254, 0], [69, 253, 97], [1, 251, 203], [80, 134, 255], [39, 77, 200], [132, 122, 237], [211, 12, 255], [255, 6, 90], [255, 125, 1], [184, 177, 0], [138, 253, 0], [129, 93, 0], [58, 40, 2], [13, 76, 5], [0, 80, 55], [19, 20, 41], [16, 31, 90], [106, 60, 24], [172, 4, 1], [225, 81, 54], [220, 105, 0], [254, 225, 0], [153, 225, 1], [96, 181, 0], [27, 28, 49], [220, 253, 84], [118, 251, 185], [150, 152, 255], [139, 98, 255], [64, 64, 64], [116, 116, 116], [222, 252, 252], [162, 4, 1], [52, 1, 0], [0, 210, 1], [0, 65, 1], [184, 177, 0], [60, 48, 0], [180, 93, 0], [76, 19, 0]];
function rgb_to_lp_color(red, green, blue) {
    let r = red * 255;
    let g = green * 255;
    let b = blue * 255;
    let colorDiffs = LP_COLOR_PALETTE.map(([ir, ig, ib]) => (r - ir) ** 2 + (g - ig) ** 2 + (b - ib) ** 2);
    let minIndex = colorDiffs.indexOf(Math.min(...colorDiffs));
    return minIndex;
}

export default class LaunchpadMK2MidiController extends MidiController {
    constructor() {
        super({ name: "LAUNCHPAD MK2" });
        this.buttons = [
            this.get_cc_buttons(),
            this.get_button_row(81),
            this.get_button_row(71),
            this.get_button_row(61),
            this.get_button_row(51),
            this.get_button_row(41),
            this.get_button_row(31),
            this.get_button_row(21),
            this.get_button_row(11),
        ]

        // console.log(this.buttons);

        this.textButtons = {
            "up": this.buttons[0][0],
            "down": this.buttons[0][1],
            "left": this.buttons[0][2],
            "right": this.buttons[0][3],
            "session": this.buttons[0][4],
            "user1": this.buttons[0][5],
            "user2": this.buttons[0][6],
            "mixer": this.buttons[0][7],
            "volume": this.buttons[1][8],
            "pan": this.buttons[2][8],
            "sendA": this.buttons[3][8],
            "sendB": this.buttons[4][8],
            "stop": this.buttons[5][8],
            "mute": this.buttons[6][8],
            "solo": this.buttons[7][8],
            "record": this.buttons[8][8],
        }
    }

    button_value_to_velocity(value) {
        return value
    }

    get_button_row(id) {
        let button_row = [];
        for (let i = 0; i < 9; i++) {
            button_row.push(new LaunchpadButton("", this, id + i));
        }
        return button_row;
    }

    get_cc_buttons() {
        let button_row = [];
        for (let i = 0; i < 8; i++) {
            button_row.push(new LaunchpadButton("", this, 104 + i, "cc"));
        }
        return button_row;
    }

    reset() {
        // There is no reset on the Launchpad
    }
}


class LaunchpadButton {
    constructor(name, lp_controller, id, type = "noteon") {
        this.button = new MidiButtonEntity(name, lp_controller, id, type);
        this.lamp = new MidiLaunchpadColorLamp(name, lp_controller, id, type);
    }

    set(...args) {
        this.lamp.set(...args);
    }

    setRGB(...args) {
        this.lamp.setRGB(...args);
    }
}

class MidiLaunchpadColorLamp extends MidiColorLampEntity {

    set(red, green, blue) {
        let color = rgb_to_lp_color(red, green, blue);
        this.send_value(color);
        // this.output_device.send('noteon', { note: this.id, velocity: color, channel: 0 });
    }

    set_rgb(red, green, blue) {
        this.output_device.send('sysex', [0xF0, 0x00, 0x20, 0x29, 0x02, 0x18, 0x0B, this.id, this.float_to_raw_value(red), this.float_to_raw_value(green), this.float_to_raw_value(blue), 0xF7]);
    }

    float_to_raw_value(value) {
        return parseInt(value * 63);
    }
}

// module.exports = LaunchpadMidiController


// noteon channel 0: on
// noteon channel 1: blinking
// noteon channel 2: fading
// noteon channel 3+: ignored

// https://launchpaddr.com/mk2palette/
// function hexToRgb(hexColor) {
//     let r = parseInt(hexColor.slice(0, 2), 16);
//     let g = parseInt(hexColor.slice(2, 4), 16);
//     let b = parseInt(hexColor.slice(4, 6), 16);
//     return [r, g, b];
// }