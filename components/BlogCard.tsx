import Link from "next/link";

export default function BlogCard({ blog }: { blog: any }) {
  return (
    <Link href={`/blog/${blog.id}`}>
      <div className="p-4 border rounded-lg hover:bg-gray-100 transition">
        <h2 className="text-xl font-semibold">{blog.title}</h2>
        <p className="text-sm text-gray-500">by {blog.author}</p>
        <p className="mt-2">{blog.content.slice(0, 100)}...</p>
      </div>
    </Link>
  );
}
