import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <Image src="/logo.png" alt="Kohi Mina Cafe" width={300} height={120} className="mx-auto" />
        <p className="text-coffee-600 text-lg">コーヒーみな — Smart QR Table Ordering</p>
        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full py-3 px-6 bg-coffee-600 text-white rounded-xl font-semibold hover:bg-coffee-700 transition-colors"
          >
            Staff Login
          </Link>
          <p className="text-coffee-500 text-sm">
            Customers — scan the QR code on your table to order
          </p>
        </div>
      </div>
    </div>
  );
}
