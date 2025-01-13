# ColoredShapes

Final project for the course "Interaction and information design" at FRI UNI.

## Installation

Install all dependencies with `npm install` and run the project with `npm start`.
A webpage should open, otherwise navigate to `http://localhost:1234/`. Allow the page to use your camera.

## Usage

For best experience go to full screen (F11) and click `f` to enter fullscreen mode.

Refer to [info.pdf](info.pdf) for all different hand gestures and their effects.

Start the game by doing a thumbs up with your right hand.
A shape will appear on the screen, and you have to recreate it by using avaialable gestures.
Confirm your shape by doing a thumbs up with your right hand.
Based on your performance you will get a score.
The score is composed of two parts:
- colour accuracy: how well you matched the colour of the shape
- shape accuracy: how well you matched the shape of the shape

When you accumulate enough points, you will level up and the game will get harder.
Colour difficulty increases like this:
- `EASY`: 1 RGB channel
- `MEDIUM`: 2 RGB channels
- `HARD`: 3 RGB channels

Shape difficulty increases like this:
- `EASY`: circles only
- `MEDIUM`: squares and triangles
- `HARD`: random polygons

