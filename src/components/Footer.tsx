import pkg from '../../package.json';

export default function Footer() {
  return (
    <footer className="text-center py-3 text-xs text-gray-500 bg-white border-t border-gray-200">
      FairwayConnect v{pkg.version}
    </footer>
  );
}
