
export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-600">
          FrameCraft Admin Panel • © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
