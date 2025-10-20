<?php

namespace Modules\Message\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;
use Nwidart\Modules\Traits\PathNamespace;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class MessageServiceProvider extends ServiceProvider
{
    use PathNamespace;

    protected string $name = 'Message';
    protected string $nameLower = 'message';

    /**
     * Boot the application events.
     */
    public function boot(): void
    {
        $this->registerCommands();
        $this->registerCommandSchedules();
        $this->registerTranslations();
        $this->registerConfig();
        $this->registerViews();
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));
        $this->registerBroadcastChannels();
    }

    /**
     * Register the service provider.
     */
    public function register(): void
    {
        $this->app->register(EventServiceProvider::class);
        $this->app->register(RouteServiceProvider::class);
    }

    /**
     * Register commands.
     */
    protected function registerCommands(): void
    {
        // $this->commands([]);
    }

    /**
     * Register command schedules.
     */
    protected function registerCommandSchedules(): void
    {
        // $this->app->booted(function () {
        //     $schedule = $this->app->make(Schedule::class);
        //     $schedule->command('inspire')->hourly();
        // });
    }

    /**
     * Register translations.
     */
    public function registerTranslations(): void
    {
        $langPath = resource_path('lang/modules/' . $this->nameLower);

        if (is_dir($langPath)) {
            $this->loadTranslationsFrom($langPath, $this->nameLower);
            $this->loadJsonTranslationsFrom($langPath);
        } else {
            $this->loadTranslationsFrom(module_path($this->name, 'lang'), $this->nameLower);
            $this->loadJsonTranslationsFrom(module_path($this->name, 'lang'));
        }
    }

    /**
     * Register config.
     */
    protected function registerConfig(): void
    {
        $configPath = module_path($this->name, config('modules.paths.generator.config.path'));

        if (is_dir($configPath)) {
            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($configPath));

            foreach ($iterator as $file) {
                if ($file->isFile() && $file->getExtension() === 'php') {
                    $config = str_replace($configPath . DIRECTORY_SEPARATOR, '', $file->getPathname());
                    $config_key = str_replace([DIRECTORY_SEPARATOR, '.php'], ['.', ''], $config);
                    $segments = explode('.', $this->nameLower . '.' . $config_key);

                    // Remove duplicated adjacent segments
                    $normalized = [];
                    foreach ($segments as $segment) {
                        if (end($normalized) !== $segment) {
                            $normalized[] = $segment;
                        }
                    }

                    $key = ($config === 'config.php') ? $this->nameLower : implode('.', $normalized);

                    $this->publishes([$file->getPathname() => config_path($config)], 'config');
                    $this->merge_config_from($file->getPathname(), $key);
                }
            }
        }
    }

    /**
     * Merge config from the given path recursively.
     */
    protected function merge_config_from(string $path, string $key): void
    {
        $existing = config($key, []);
        $module_config = require $path;

        config([$key => array_replace_recursive($existing, $module_config)]);
    }

    /**
     * Register views.
     */
    public function registerViews(): void
    {
        $viewPath = resource_path('views/modules/' . $this->nameLower);
        $sourcePath = module_path($this->name, 'resources/views');

        $this->publishes([$sourcePath => $viewPath], ['views', $this->nameLower . '-module-views']);

        $this->loadViewsFrom(array_merge($this->getPublishableViewPaths(), [$sourcePath]), $this->nameLower);

        Blade::componentNamespace(
            config('modules.namespace') . '\\' . $this->name . '\\View\\Components',
            $this->nameLower
        );
    }

    /**
     * Fix: Added helper to get publishable view paths
     */
    protected function getPublishableViewPaths(): array
    {
        $paths = [];
        foreach (config('view.paths', []) as $path) {
            if (is_dir($path . '/modules/' . $this->nameLower)) {
                $paths[] = $path . '/modules/' . $this->nameLower;
            }
        }
        return $paths;
    }

    /**
     * Register broadcast channels.
     */
    protected function registerBroadcastChannels(): void
    {
        Broadcast::channel('private-conversation.{uuid}', function ($user, $uuid) {
            \Log::info('Broadcast channel authorization attempt', [
                'channel' => 'private-conversation.' . $uuid,
                'user_type' => $user ? 'authenticated' : 'anonymous',
                'user_id' => $user ? $user->id : null,
            ]);

            $conversation = \Modules\Message\Models\Conversation::where('uuid', $uuid)->first();

            if (!$conversation) {
                \Log::warning('Conversation not found for channel authorization', ['uuid' => $uuid]);
                return false;
            }

            // Staff members can access any conversation
            if ($user && ($user->is_staff ?? false)) {
                \Log::info('Staff user authorized for channel', [
                    'user_id' => $user->id,
                    'conversation_uuid' => $uuid,
                ]);
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'is_staff' => true,
                ];
            }

            // For anonymous users, check contact parameter from query string
            $contact = request()->input('contact');

            if ($contact && $conversation->created_by_contact === $contact) {
                \Log::info('Anonymous user authorized for channel', [
                    'contact' => $contact,
                    'conversation_uuid' => $uuid,
                ]);
                return [
                    'id' => $contact,
                    'name' => $conversation->created_by_name ?? 'Anonymous',
                    'is_staff' => false,
                ];
            }

            \Log::warning('Channel access denied', [
                'conversation_uuid' => $uuid,
                'provided_contact' => $contact,
                'expected_contact' => $conversation->created_by_contact,
            ]);

            return false;
        });

        // Global conversations channel for staff
        Broadcast::channel('conversations', function ($user) {
            if ($user && ($user->is_staff ?? false)) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'is_staff' => true,
                ];
            }

            return false;
        });
    }
}
