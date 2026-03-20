// frontend/src/components/notifications/NotificationPreferences/NotificationPreferences.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PreferenceToggle } from './PreferenceToggle';
import { notificationsService } from '../../../services/api/notifications.service';

interface Prefs {
  inApp: boolean;
  email: boolean;
  push: boolean;
  digest: boolean;
}

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<Prefs>({
    inApp: true,
    email: false,
    push: false,
    digest: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await notificationsService.getPreferences();
      // Backend returns the prefs object directly (or wrapped)
      const prefs = (response as any)?.data?.data ||
                    (response as any)?.data ||
                    response;
      if (prefs && typeof prefs === 'object') {
        setPreferences({
          inApp: prefs.inApp ?? true,
          email: prefs.email ?? false,
          push: prefs.push ?? false,
          digest: prefs.digest ?? false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await notificationsService.updatePreferences(preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>

      <div className="space-y-1 divide-y divide-gray-100">
        <PreferenceToggle
          label="In-App Notifications"
          description="Receive notifications within the application"
          enabled={preferences.inApp}
          onChange={(enabled) => setPreferences(prev => ({ ...prev, inApp: enabled }))}
        />
        <PreferenceToggle
          label="Email Notifications"
          description="Receive notifications via email"
          enabled={preferences.email}
          onChange={(enabled) => setPreferences(prev => ({ ...prev, email: enabled }))}
        />
        <PreferenceToggle
          label="Push Notifications"
          description="Receive push notifications on your device"
          enabled={preferences.push}
          onChange={(enabled) => setPreferences(prev => ({ ...prev, push: enabled }))}
        />
        <PreferenceToggle
          label="Daily Digest"
          description="Receive a daily summary of all notifications"
          enabled={preferences.digest}
          onChange={(enabled) => setPreferences(prev => ({ ...prev, digest: enabled }))}
        />
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving}>
          Save Preferences
        </Button>
      </div>
    </Card>
  );
};