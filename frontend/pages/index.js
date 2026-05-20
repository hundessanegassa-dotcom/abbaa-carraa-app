import Head from 'next/head';
import Link from 'next/link';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Home() {
  return (
    <>
      <Head>
        <title>Abbaa Carraa - Win Amazing Prizes</title>
        <meta name="description" content="Win amazing prizes through community savings." />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Simple Navigation */}
        <nav className="bg-green-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">🎁 Abbaa Carraa</h1>
            <div className="space-x-4">
              <Link href="/login" className="hover:underline">Login</Link>
              <Link href="/register" className="bg-white text-green-600 px-4 py-2 rounded-lg">Register</Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center py-20 px-4">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Win Amazing Prizes!</h1>
          <p className="text-xl text-gray-600 mb-8">Join community pools and win cars, houses, electronics & more</p>
          <Link href="/register" className="bg-green-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-green-700">
            Get Started →
          </Link>
          <p className="mt-8 text-green-600">💚 2% supports kidney & heart disease patients</p>
        </div>

        {/* Simple Stats */}
        <div className="bg-gray-100 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div><div className="text-3xl font-bold text-green-600">10+</div><div className="text-gray-600">Active Pools</div></div>
              <div><div className="text-3xl font-bold text-green-600">50+</div><div className="text-gray-600">Winners</div></div>
              <div><div className="text-3xl font-bold text-green-600">20+</div><div className="text-gray-600">Agents</div></div>
              <div><div className="text-3xl font-bold text-green-600">ETB 500K+</div><div className="text-gray-600">Raised</div></div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">1</div><h3 className="font-bold text-xl mb-2">Find a Pool</h3><p className="text-gray-600">Browse available prize pools</p></div>
              <div><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">2</div><h3 className="font-bold text-xl mb-2">Contribute</h3><p className="text-gray-600">Make your contribution securely</p></div>
              <div><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">3</div><h3 className="font-bold text-xl mb-2">Win!</h3><p className="text-gray-600">Win amazing prizes!</p></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-6 text-center">
          <p>© 2024 Abbaa Carraa - Empowering Dreams</p>
        </footer>
      </div>
    </>
  );
}
