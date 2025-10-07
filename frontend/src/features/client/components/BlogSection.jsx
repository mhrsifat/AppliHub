// src/features/client/components/BlogSection.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const posts = [
  {
    slug: "how-to-extend-battery-life",
    title: "How to extend battery life",
    excerpt: "Simple steps to keep your device battery healthy.",
    img: "https://via.placeholder.com/400x240?text=Blog+1",
  },
  {
    slug: "network-tips",
    title: "5 networking tips for small offices",
    excerpt: "Improve speed and reliability with these quick tips.",
    img: "https://via.placeholder.com/400x240?text=Blog+2",
  },
  {
    slug: "timesaving-hacks",
    title: "Timesaving maintenance hacks",
    excerpt: "Small habits that save you hours over the year.",
    img: "https://via.placeholder.com/400x240?text=Blog+3",
  },
];

export default function BlogSection() {
  return (
    <section className="py-12 bg-background text-text">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-6">From our blog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <article key={p.slug} className="bg-surface rounded-lg overflow-hidden shadow-sm">
              <img src={p.img} alt={p.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted mb-3">{p.excerpt}</p>
                <NavLink to={`/blog/${p.slug}`} className="text-sm font-medium">
                  Read more →
                </NavLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}