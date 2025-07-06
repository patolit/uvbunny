import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService, BaseConfiguration } from '../../services/firebase';

@Component({
  selector: 'app-configuration-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './configuration-page.html',
  styleUrl: './configuration-page.scss'
})
export class ConfigurationPage implements OnInit {
  configuration: BaseConfiguration | null = null;
  loading = true;
  saving = false;
  error = '';
  firebaseConnected = false;
  firebaseStatus = 'Checking connection...';

  // Form values
  lettuceScore = 1;
  carrotScore = 3;
  playScore = 2;
  rewardScore = 1;

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit(): Promise<void> {
    await this.checkFirebaseConnection();
    await this.loadConfiguration();
  }

  async checkFirebaseConnection(): Promise<void> {
    try {
      this.firebaseStatus = 'Testing connection...';

      // Try to get the base configuration to test the connection
      await this.firebaseService.getBaseConfiguration();

      this.firebaseConnected = true;
      this.firebaseStatus = 'Connected to Firebase';
    } catch (error) {
      console.error('Firebase connection error:', error);
      this.firebaseConnected = false;
      this.firebaseStatus = 'Connection failed';
    }
  }

  async loadConfiguration(): Promise<void> {
    try {
      this.loading = true;
      this.configuration = await this.firebaseService.getBaseConfiguration();

      // Update form values
      this.lettuceScore = this.configuration.meals.lettuce;
      this.carrotScore = this.configuration.meals.carrot;
      this.playScore = this.configuration.playScore;
      this.rewardScore = this.configuration.rewardScore;
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.error = 'Failed to load configuration';
    } finally {
      this.loading = false;
    }
  }

  async saveConfiguration(): Promise<void> {
    try {
      this.saving = true;
      this.error = '';

      const updatedConfig: Partial<BaseConfiguration> = {
        meals: {
          lettuce: this.lettuceScore,
          carrot: this.carrotScore
        },
        playScore: this.playScore,
        rewardScore: this.rewardScore
      };

      await this.firebaseService.updateBaseConfiguration(updatedConfig);

      // Reload to get the updated configuration
      await this.loadConfiguration();

      // Show success message (you could add a toast notification here)
      console.log('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving configuration:', error);
      this.error = 'Failed to save configuration';
    } finally {
      this.saving = false;
    }
  }

  async resetToDefaults(): Promise<void> {
    try {
      this.saving = true;
      this.error = '';

      const defaultConfig: Partial<BaseConfiguration> = {
        rewardScore: 1,
        playScore: 2,
        meals: {
          lettuce: 1,
          carrot: 3
        },
        activities: {
          play: 2,
          petting: 1,
          grooming: 1
        }
      };

      await this.firebaseService.updateBaseConfiguration(defaultConfig);

      // Update form values
      this.lettuceScore = defaultConfig.meals!.lettuce;
      this.carrotScore = defaultConfig.meals!.carrot;
      this.playScore = defaultConfig.playScore!;
      this.rewardScore = defaultConfig.rewardScore!;

      // Reload configuration
      await this.loadConfiguration();

      console.log('Configuration reset to defaults!');
    } catch (error) {
      console.error('Error resetting configuration:', error);
      this.error = 'Failed to reset configuration';
    } finally {
      this.saving = false;
    }
  }
}
