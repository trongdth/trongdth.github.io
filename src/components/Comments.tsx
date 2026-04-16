import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Comment {
  id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

interface CommentsProps {
  postId: string;
}

const Comments: React.FC<CommentsProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Fetch comments
    fetchComments();

    return () => subscription.unsubscribe();
  }, [postId]);

  const fetchComments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data || []);
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
      },
    });
    if (error) console.error('Error logging in:', error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      author_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Anonymous',
      author_avatar: user.user_metadata.avatar_url,
      content: newComment.trim(),
    });

    if (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } else {
      setNewComment('');
      fetchComments(); // Refresh list
    }
    setIsSubmitting(false);
  };

  return (
    <div className="comments-section" id="comments">
      <h3 className="glow-text">Comments ({comments.length})</h3>

      <div className="auth-status">
        {user ? (
          <div className="user-info">
            <img src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} className="avatar" />
            <span>Logged in as <strong>{user.user_metadata.full_name}</strong></span>
            <button onClick={handleLogout} className="btn-text">Logout</button>
          </div>
        ) : (
          <div className="login-prompt">
            <p>Sign in with Google to join the conversation:</p>
            <button onClick={handleLogin} className="btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      <div className="comment-form-container">
        {user ? (
          <form onSubmit={handleSubmit} className="comment-form">
            <textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              rows={3}
            />
            <button type="submit" className="btn" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : null}
      </div>

      <div className="comments-list">
        {isLoading ? (
          <p className="loading">Loading comments...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="comment-card card">
              <div className="comment-header">
                {comment.author_avatar && (
                  <img src={comment.author_avatar} alt={comment.author_name} className="avatar-sm" />
                )}
                <span className="author">{comment.author_name}</span>
                <span className="date">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="comment-body">
                <p>{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-comments">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>

      <style>{`
        .comments-section {
          margin-top: 4rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-color);
        }
        .auth-status {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid var(--accent-cyan);
        }
        .avatar-sm {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .btn-text {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: underline;
        }
        .btn-text:hover {
          color: var(--accent-purple);
        }
        .comment-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 3rem;
        }
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .comment-card {
          padding: 1rem;
          transform: none !important; /* Disable lift on hover for comments */
        }
        .comment-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }
        .author {
          font-weight: 600;
          color: var(--text-primary);
        }
        .date {
          color: var(--text-muted);
          margin-left: auto;
        }
        .comment-body p {
          margin: 0;
          color: var(--text-secondary);
          white-space: pre-wrap;
        }
        .login-prompt p {
          margin-bottom: 1rem;
        }
        .loading, .no-comments {
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default Comments;
