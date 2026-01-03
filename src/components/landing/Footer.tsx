export default function Footer() {
  return (
    <footer className="bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl border-t border-slate-200/70 pt-6">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} WGN — Work Gantt Navigator
        </p>
      </div>
    </footer>
  );
}
