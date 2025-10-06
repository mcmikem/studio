
export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="p-4 lg:p-6">{children}</main>
    )
}
