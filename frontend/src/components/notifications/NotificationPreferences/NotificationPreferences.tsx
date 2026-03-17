// frontend/src/components/notifications/NotificationPreferences/NotificationPreferences.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PreferenceToggle } from './PreferenceToggle';
import { notificationsService } from '../../../services/api/notifications.service';
import { NotificationPreferences as INotificationPreferences } from '../../../types/notification.types';

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<INotificationPreferences>({
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
      const data = await notificationsService.getPreferences();
      setPreferences(data);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
      
      <div className="space-y-4">
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
          enabled={preferences.digest || false}
          onChange={(enabled) => setPreferences(prev => ({ ...prev, digest: enabled }))}
        />
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
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