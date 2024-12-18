import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-zinc-800 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="font-bold mb-4">Contact Us</h3>
            <div className="space-y-2">
              <p>State Restaurant Equipment</p>
              <p>1-702-733-1515</p>
              <p>sales@staterestaurant.com</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-blue-600">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-gray-600">
          <p>
            © {new Date().getFullYear()} State Restaurant Equipment. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
