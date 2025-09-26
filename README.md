# The Mzansi Meter - The SA Guessing Game

This is a web-based "Higher or Lower" guessing game with a South African theme. Test your knowledge of Mzansi trivia, from the price of a Stoney Ginger Beer to the year Siya Kolisi first captained the Springboks.

## How to Play

The game is simple:
1.  A question and a value will be displayed.
2.  You have to guess if the actual answer is **Higher** or **Lower** than the value shown.
3.  Get as many right as you can in a row. One wrong guess and it's game over!

## Game Modes

### Endless Mode

In this mode, you'll be presented with a random selection of questions. The goal is to get the highest score possible. Your high score is saved locally on your device.

### Daily Challenge

The Daily Challenge presents a specific set of questions that are the same for every player on a given day. This mode allows you to compete against others on a level playing field. Daily leaderboards are stored on Firebase.

## Technical Details

*   **Frontend**: HTML, CSS, JavaScript
*   **Backend**: Firebase Firestore is used for the daily and all-time leaderboards.
*   **Dependencies**:
    *   `canvas-confetti`: For the confetti effect on correct answers.
    *   `firebase`: To connect to the Firebase backend.

## Local Setup

To run the project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/mzansi-meter-game.git
    cd mzansi-meter-game
    ```

2.  **Install dependencies:**
    This project doesn't have any server-side dependencies that require `npm install` for the game itself to run. The dependencies listed in `package.json` (`canvas` and `firebase`) are included via CDNs in the `index.html` file.

3.  **Run a local server:**
    Since the game fetches `questions.json` using the `fetch` API, you'll need to run it from a local web server to avoid CORS issues. A simple way to do this is with Python's built-in HTTP server.

    If you have Python 3:
    ```bash
    python -m http.server
    ```

    If you have Python 2:
    ```bash
    python -m SimpleHTTPServer
    ```

    Once the server is running, open your web browser and navigate to `http://localhost:8000`.

## `questions.json` Format

The `questions.json` file is an array of question objects. Each object has the following structure:

```json
{
    "question": "The text of the question to be displayed.",
    "value": 123.45,
    "format": "currency" | "number" | "year",
    "image": "optional_url_to_an_image"
}
```

*   `question`: A string containing the question text.
*   `value`: A number representing the correct answer.
*   `format`: A string that determines how the value is displayed.
    *   `currency`: Formats the number as South African Rand (e.g., "R19.99").
    *   `number`: Formats the number with comma separators (e.g., "1,940").
    *   `year`: Displays the number as is (e.g., "1990").
*   `image`: An optional string containing a URL to an image related to the question. If provided, the image will be displayed with the question.