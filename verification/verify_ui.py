from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000/")
        # Wait for Sidebar
        page.wait_for_selector("aside", timeout=5000)
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="debug.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
