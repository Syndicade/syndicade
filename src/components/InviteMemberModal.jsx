import { useState } from 'react';
import { X, UserPlus, Copy, Check } from 'lucide-react';

var INVITE_LINK = 'https://syndicade-git-main-syndicades-projects.vercel.app/signup';
var INVITE_TEXT = "Hey! I've been using Syndicade to discover and manage local nonprofit events and organizations. Come check it out — it's free to join!";

export default function InviteMemberModal({ isOpen, onClose }) {
  var [linkCopied, setLinkCopied] = useState(false);
  var [textCopied, setTextCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(INVITE_LINK);
    setLinkCopied(true);
    setTimeout(function() { setLinkCopied(false); }, 2000);
  }

  function copyText() {
    navigator.clipboard.writeText(INVITE_TEXT + ' ' + INVITE_LINK);
    setTextCopied(true);
    setTimeout(function() { setTextCopied(false); }, 2000);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background: 'rgba(0,0,0,0.7)'}}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-friend-title"
    >
      <div
        className="w-full max-w-md rounded-xl border"
        style={{background: '#1A2035', borderColor: '#2A3550'}}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{borderColor: '#2A3550'}}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{background: 'rgba(59,130,246,0.15)'}}
            >
              <UserPlus size={16} className="text-blue-400" aria-hidden="true" />
            </div>
            <h2
              id="invite-friend-title"
              className="font-bold text-white"
              style={{fontSize: '16px'}}
            >
              Invite a Friend
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close invite friend dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">

          <p className="text-sm" style={{color: '#94A3B8'}}>
            Share Syndicade with someone who'd love it. Copy the link or grab the full message below.
          </p>

          {/* Link copy */}
          <div>
            <p
              className="text-xs font-semibold uppercase mb-2"
              style={{color: '#F5B731', letterSpacing: '4px'}}
            >
              Invite Link
            </p>
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-2.5"
              style={{background: '#0E1523', border: '1px solid #2A3550'}}
            >
              <span
                className="flex-1 text-sm truncate"
                style={{color: '#64748B'}}
              >
                {INVITE_LINK}
              </span>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
                style={{
                  background: linkCopied ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                  color: linkCopied ? '#22C55E' : '#3B82F6',
                  border: '1px solid ' + (linkCopied ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)')
                }}
                aria-label="Copy invite link"
              >
                {linkCopied
                  ? <><Check size={12} aria-hidden="true" /> Copied</>
                  : <><Copy size={12} aria-hidden="true" /> Copy</>
                }
              </button>
            </div>
          </div>

          {/* Message copy */}
          <div>
            <p
              className="text-xs font-semibold uppercase mb-2"
              style={{color: '#F5B731', letterSpacing: '4px'}}
            >
              Ready-to-send Message
            </p>
            <div
              className="rounded-lg px-4 py-3"
              style={{background: '#0E1523', border: '1px solid #2A3550'}}
            >
              <p
                className="text-sm leading-relaxed mb-3"
                style={{color: '#CBD5E1'}}
              >
                {INVITE_TEXT}
              </p>
              <button
                onClick={copyText}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  background: textCopied ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                  color: textCopied ? '#22C55E' : '#3B82F6',
                  border: '1px solid ' + (textCopied ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)')
                }}
                aria-label="Copy full invite message"
              >
                {textCopied
                  ? <><Check size={12} aria-hidden="true" /> Copied</>
                  : <><Copy size={12} aria-hidden="true" /> Copy Message + Link</>
                }
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div
          className="flex justify-end px-6 py-4 border-t"
          style={{borderColor: '#2A3550'}}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-gray-500"
            style={{background: 'transparent', borderColor: '#2A3550', color: '#94A3B8'}}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}