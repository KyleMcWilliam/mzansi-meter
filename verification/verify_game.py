from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Load the game
        page.goto("http://localhost:8000")

        # 2. Check Mute Button on Start Screen
        mute_button = page.locator("#mute-button")
        mute_button.wait_for(state="visible")

        # Take screenshot of start screen with mute button
        page.screenshot(path="verification/start_screen.png")
        print("Start screen screenshot taken.")

        # 3. Start Game to check Lives
        page.click("#start-button")

        # Wait for game screen
        page.wait_for_selector("#game-screen.active")

        # Check Lives Display
        lives_display = page.locator("#lives-display")
        lives_display.wait_for(state="visible")

        # Take screenshot of game screen
        page.screenshot(path="verification/game_screen.png")
        print("Game screen screenshot taken.")

        # 4. Trigger a Toast (Mute/Unmute)
        mute_button.click() # Mute
        mute_button.click() # Unmute (no toast for this, but verifies clickability)

        # 5. Trigger a wrong answer to see Toast and Lives update
        # We need to know the question to get it wrong.
        # But randomly clicking one is likely to be wrong or correct.
        # Let's just click 'Higher' and see.
        page.click("#higher-button")

        # Wait a bit for toast animation
        page.wait_for_timeout(500)

        # Take screenshot of potential toast/feedback
        page.screenshot(path="verification/toast_feedback.png")
        print("Toast feedback screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_changes()
