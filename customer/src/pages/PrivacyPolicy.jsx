import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
    return (
        <section className="ara-legal-page">
            <div className="ara-legal-inner">
                <div className="ara-legal-eyebrow">ARAmane Arts</div>
                <h1>Privacy Policy</h1>
                <p className="ara-legal-intro">We respect your privacy and are committed to handling your information responsibly when you use ARAmane Arts.</p>

                <div className="ara-legal-content">
                    <p><strong>Last updated: September 16, 2026</strong></p>

                    <h2>1. Information we collect</h2>
                    <p>When you create an account, place an order, contact us, or use features of this website, we may collect information such as your name, email address, phone number, shipping and billing details, account information, order details, and information you choose to provide to us.</p>
                    <p>We may also receive technical information needed to operate and secure the website, such as IP address, browser information, device information, and basic request or error information.</p>

                    <h2>2. How we use your information</h2>
                    <p>We use information to provide and improve our services, process and fulfil orders, communicate with you about orders and your account, provide customer support, maintain website security, prevent misuse, and meet applicable legal or regulatory obligations.</p>

                    <h2>3. Payments</h2>
                    <p>Payment information may be processed through payment service providers. We do not intend to store complete card or other sensitive payment credentials on our own systems when those details are handled by a payment provider.</p>

                    <h2>4. Authentication and accounts</h2>
                    <p>If you create an account or use a supported sign-in service, information required to authenticate and maintain your account may be processed by us and by the relevant authentication provider.</p>

                    <h2>5. Sharing information</h2>
                    <p>We may share information with service providers who help us operate the website, process payments, send transactional communications, provide hosting or technical services, or fulfil orders. We may also disclose information when required by applicable law or to protect our rights, users, or services.</p>

                    <h2>6. Cookies and similar technologies</h2>
                    <p>The website may use cookies, local storage, session storage, or similar technologies to maintain sessions, remember necessary preferences, operate account and cart features, and improve security and functionality.</p>

                    <h2>7. Data security</h2>
                    <p>We use reasonable technical and organisational measures designed to protect information against unauthorised access, alteration, disclosure, or destruction. No internet-based service can guarantee absolute security.</p>

                    <h2>8. Data retention</h2>
                    <p>We retain information for as long as reasonably necessary for the purposes described in this policy, including order fulfilment, account administration, dispute resolution, security, record keeping, and applicable legal requirements.</p>

                    <h2>9. Your choices and requests</h2>
                    <p>Depending on applicable law, you may have rights concerning access to, correction of, or deletion of personal information, as well as other privacy rights. Requests can be made through our contact channel, subject to reasonable verification and applicable legal requirements.</p>

                    <h2>10. Children</h2>
                    <p>Our services are not directed at children who are not legally able to use them. We do not knowingly seek to collect personal information from children in violation of applicable law.</p>

                    <h2>11. Third-party services and links</h2>
                    <p>The website may use or link to third-party services. Their privacy practices are governed by their own policies, and we encourage you to review those policies before providing information to them.</p>

                    <h2>12. Changes to this policy</h2>
                    <p>We may update this Privacy Policy from time to time. The updated version will be posted on this page with a revised date. Your continued use of the website after an update means the updated policy will apply to your use of the website, to the extent permitted by law.</p>

                    <h2>13. Contact</h2>
                    <p>If you have a privacy question or request, please use our <Link to="/contact">Contact Us</Link> page.</p>
                </div>
            </div>
            <style>{`.ara-legal-page{background:#faf6ee;color:#5b1217;padding:70px 20px 100px}.ara-legal-inner{width:min(900px,100%);margin:0 auto}.ara-legal-eyebrow{color:#b18d2d;font:600 10px/1.2 'DM Sans',sans-serif;letter-spacing:.28em;text-transform:uppercase;margin-bottom:18px}.ara-legal-page h1{margin:0;font:400 clamp(48px,8vw,82px)/.95 'Cormorant Garamond',serif}.ara-legal-intro{max-width:700px;margin:24px 0 55px;color:#735f57;font:400 16px/1.8 'DM Sans',sans-serif}.ara-legal-content{border-top:1px solid rgba(91,18,23,.16);padding-top:35px}.ara-legal-content h2{margin:36px 0 10px;font:500 27px/1.15 'Cormorant Garamond',serif}.ara-legal-content p{margin:0 0 15px;color:#5f504b;font:400 14px/1.85 'DM Sans',sans-serif}.ara-legal-content a{color:#5b1217;text-decoration:underline;text-underline-offset:3px}@media(max-width:600px){.ara-legal-page{padding:48px 15px 75px}.ara-legal-intro{font-size:14px;margin-bottom:40px}.ara-legal-content h2{font-size:24px}}`}</style>
        </section>
    )
}
