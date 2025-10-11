#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def test_review_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        try:
            print("1. Navigating to venue page...")
            page.goto('http://localhost:4321/venue/perot-museum-of-nature-and-science')
            time.sleep(2)

            # Take screenshot of venue page
            page.screenshot(path='screenshot-1-venue-page.png', full_page=True)
            print("   Screenshot saved: screenshot-1-venue-page.png")

            print("2. Current URL:", page.url)

            print("3. Looking for 'Write a review' button...")
            review_buttons = page.locator('text=Write a review')
            button_count = review_buttons.count()
            print(f"   Found {button_count} review button(s)")

            if button_count > 0:
                href = review_buttons.get_attribute('href')
                print(f"   Review button href: {href}")

                print("4. Clicking 'Write a review' button...")
                review_buttons.click()
                time.sleep(2)

                print("5. After click URL:", page.url)

                # Take screenshot of login page
                page.screenshot(path='screenshot-2-after-click.png', full_page=True)
                print("   Screenshot saved: screenshot-2-after-click.png")

                # Check what's on the page
                page_title = page.title()
                h1_text = page.locator('h1').first.text_content()
                print(f"   Page title: {page_title}")
                print(f"   H1 text: {h1_text}")

                # Look for email input
                email_inputs = page.locator('input[type="email"]')
                email_count = email_inputs.count()
                print(f"   Email inputs found: {email_count}")

                if email_count > 0 and 'login' in page.url.lower():
                    print("\n✅ SUCCESS: Review button works correctly!")
                    print("   - Redirected to login page")
                    print("   - Login form is displayed")
                else:
                    print("\n⚠️  Unexpected result - check screenshots")
            else:
                print("\n❌ No review button found on the page")

            time.sleep(3)

        except Exception as e:
            print(f"\n❌ Error: {e}")
            page.screenshot(path='screenshot-error.png', full_page=True)
        finally:
            browser.close()

if __name__ == '__main__':
    test_review_button()
