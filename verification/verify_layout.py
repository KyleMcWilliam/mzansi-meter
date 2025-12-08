from playwright.sync_api import sync_playwright
import sys

def verify_layout():
    try:
        with sync_playwright() as p:
            print("Launching browser...")
            browser = p.chromium.launch(headless=True)
            print("Creating context...")
            context = browser.new_context(viewport={'width': 360, 'height': 780}, user_agent='Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36')
            page = context.new_page()

            print("Navigating...")
            page.goto('http://localhost:8080')

            print("Waiting for loading screen to disappear...")
            try:
                page.wait_for_selector('#loading-screen', state='hidden', timeout=5000)
            except Exception as e:
                print(f"Loading screen didn't disappear: {e}")
                # Force remove it just in case logic is stuck
                page.evaluate("document.getElementById('loading-screen').style.display = 'none'")

            print("Clicking Endless Mode...")
            page.get_by_role('button', name='Endless Mode').click()

            print("Waiting for Game Screen...")
            page.wait_for_selector('#game-screen.active', timeout=5000)

            print("Taking screenshot...")
            page.screenshot(path='verification/game_screen.png')

            browser.close()
            print("Done.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    verify_layout()
