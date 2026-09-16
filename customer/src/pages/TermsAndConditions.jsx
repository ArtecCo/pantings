import { Link } from 'react-router-dom'

export default function TermsAndConditions() {
    return (
        <section className="ara-legal-page">
            <div className="ara-legal-inner">
                <div className="ara-legal-eyebrow">ARAmane Arts</div>
                <h1>Terms &amp; Conditions</h1>
                <p className="ara-legal-intro">These terms describe the conditions that apply when you access or use the ARAmane Arts website and purchase products from us.</p>

                <div className="ara-legal-content">
                    <p><strong>Last updated: September 16, 2026</strong></p>

                    <h2>1. About these terms</h2>
                    <p>By accessing or using this website, creating an account, or placing an order, you agree to these Terms &amp; Conditions and any policies referenced on this website. If you do not agree, please do not use the website.</p>

                    <h2>2. Our products</h2>
                    <p>ARAmane Arts offers handcrafted artwork. Because handmade pieces may have natural variations, the appearance, texture, finish, dimensions, and other characteristics of an individual work may vary from photographs or descriptions shown online.</p>

                    <h2>3. Product information</h2>
                    <p>We make reasonable efforts to present product names, descriptions, dimensions, prices, availability, and images accurately. Errors may occasionally occur. We reserve the right to correct errors, update information, or cancel an order where information was materially incorrect, subject to applicable law.</p>

                    <h2>4. Prices and orders</h2>
                    <p>Prices and availability may change without prior notice. An order submitted through the website is a request to purchase. We may accept, decline, or cancel an order where necessary, including where an item is unavailable or a material error has occurred.</p>

                    <h2>5. Accounts</h2>
                    <p>You are responsible for providing accurate account information and for keeping your account credentials confidential. You should notify us if you believe your account has been accessed without authorisation.</p>

                    <h2>6. Payments</h2>
                    <p>Payments may be processed by third-party payment providers. You agree to provide valid payment information and to complete payment for orders you place, subject to the payment provider's terms and any applicable cancellation or refund provisions.</p>

                    <h2>7. Order status and cancellation</h2>
                    <p>Orders may move through different processing states. Cancellation availability depends on the status of the order and our applicable order process. An order that has reached a status where cancellation is no longer available cannot be cancelled through the customer account.</p>

                    <h2>8. Delivery</h2>
                    <p>Delivery arrangements, timelines, charges, and applicable restrictions may vary by order and destination. Any delivery information presented at checkout or in order communications forms part of the applicable order terms.</p>

                    <h2>9. Returns, refunds, and issues</h2>
                    <p>Any applicable return, refund, replacement, or damage-resolution terms will be communicated through the relevant order or support process and will be handled in accordance with applicable law.</p>

                    <h2>10. Intellectual property</h2>
                    <p>Unless otherwise stated, website content including artwork images, photographs, text, branding, logos, designs, and other materials belongs to ARAmane Arts or its respective licensors. You may not reproduce, distribute, modify, sell, or commercially exploit such content without prior permission.</p>

                    <h2>11. Acceptable use</h2>
                    <p>You must not misuse the website, attempt to gain unauthorised access, interfere with its operation, submit malicious code, impersonate another person, or use the service for unlawful purposes.</p>

                    <h2>12. Third-party services</h2>
                    <p>The website may depend on third-party services such as payment, authentication, hosting, email, or other technology providers. Your use of those services may also be subject to their own terms and policies.</p>

                    <h2>13. Website availability</h2>
                    <p>We aim to keep the website available and functional but do not guarantee uninterrupted or error-free access. Maintenance, updates, technical problems, or circumstances outside our reasonable control may temporarily affect availability.</p>

                    <h2>14. Limitation of liability</h2>
                    <p>To the extent permitted by applicable law, ARAmane Arts will not be responsible for indirect, incidental, special, or consequential losses arising from use of the website or inability to use it. Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited.</p>

                    <h2>15. Changes to these terms</h2>
                    <p>We may update these Terms &amp; Conditions from time to time. The revised version will be posted on this page with an updated date. Continued use of the website after an update constitutes acceptance of the revised terms to the extent permitted by law.</p>

                    <h2>16. Governing law</h2>
                    <p>These terms are subject to the laws applicable to the operation of ARAmane Arts and the transaction, without limiting any mandatory consumer protections that may apply to you.</p>

                    <h2>17. Contact</h2>
                    <p>For questions about these terms or an order, please use our <Link to="/contact">Contact Us</Link> page.</p>
                </div>
            </div>
            <style>{`.ara-legal-page{background:#faf6ee;color:#5b1217;padding:70px 20px 100px}.ara-legal-inner{width:min(900px,100%);margin:0 auto}.ara-legal-eyebrow{color:#b18d2d;font:600 10px/1.2 'DM Sans',sans-serif;letter-spacing:.28em;text-transform:uppercase;margin-bottom:18px}.ara-legal-page h1{margin:0;font:400 clamp(48px,8vw,82px)/.95 'Cormorant Garamond',serif}.ara-legal-intro{max-width:700px;margin:24px 0 55px;color:#735f57;font:400 16px/1.8 'DM Sans',sans-serif}.ara-legal-content{border-top:1px solid rgba(91,18,23,.16);padding-top:35px}.ara-legal-content h2{margin:36px 0 10px;font:500 27px/1.15 'Cormorant Garamond',serif}.ara-legal-content p{margin:0 0 15px;color:#5f504b;font:400 14px/1.85 'DM Sans',sans-serif}.ara-legal-content a{color:#5b1217;text-decoration:underline;text-underline-offset:3px}@media(max-width:600px){.ara-legal-page{padding:48px 15px 75px}.ara-legal-intro{font-size:14px;margin-bottom:40px}.ara-legal-content h2{font-size:24px}}`}</style>
        </section>
    )
}
